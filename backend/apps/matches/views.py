from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import CompatibilityScore, UserMatchDecision
from .serializers import MatchListItemSerializer, MatchDetailSerializer, DecisionSerializer
from .bloom import batch_probably_decided, add_decision, ensure_bloom_filter


class MatchListView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        parameters=[
            OpenApiParameter("page", int, default=1),
            OpenApiParameter("page_size", int, default=20),
            OpenApiParameter("min_score", int, default=0),
            OpenApiParameter("religion", str, required=False),
        ],
        responses=MatchListItemSerializer(many=True),
        summary="Get ranked match list",
    )
    def get(self, request):
        try:
            profile = request.user.profile
        except Exception:
            return Response({"detail": "Complete onboarding first."}, status=400)

        page = max(1, int(request.query_params.get("page", 1)))
        page_size = min(50, max(1, int(request.query_params.get("page_size", 20))))
        min_score = float(request.query_params.get("min_score", 0))
        religion_filter = request.query_params.get("religion", "")

        uid = str(profile.user_id)

        # Fetch all scored candidates (ordered by score descending)
        scores_qs = (
            CompatibilityScore.objects
            .filter(
                Q(user_a_id=uid) | Q(user_b_id=uid),
                overall_score__gte=min_score,
            )
            .select_related("user_a__user", "user_b__user", "user_a__birth_chart", "user_b__birth_chart")
            .order_by("-overall_score")
        )

        if religion_filter:
            scores_qs = scores_qs.filter(
                Q(user_a__religion=religion_filter) | Q(user_b__religion=religion_filter)
            )

        # Collect candidate IDs and score objects
        all_scores = list(scores_qs)
        candidate_ids = []
        score_map = {}
        for s in all_scores:
            cid = str(s.user_b_id) if str(s.user_a_id) == uid else str(s.user_a_id)
            candidate_ids.append(cid)
            score_map[cid] = s

        # Bloom filter pre-filter (one Redis round-trip)
        ensure_bloom_filter(uid)
        probably_seen = batch_probably_decided(uid, candidate_ids)

        # Build unseen candidate list (confirm positives against DB)
        confirmed_decided = set()
        bloom_positives = [cid for cid, seen in zip(candidate_ids, probably_seen) if seen]
        if bloom_positives:
            confirmed_decided = set(
                str(d) for d in UserMatchDecision.objects
                .filter(user_id=uid, candidate_id__in=bloom_positives)
                .values_list("candidate_id", flat=True)
            )

        unseen_candidates = [
            cid for cid, seen in zip(candidate_ids, probably_seen)
            if not seen or cid not in confirmed_decided
        ]

        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        page_candidates = unseen_candidates[start:end]

        # Build response items
        items = []
        for cid in page_candidates:
            score = score_map[cid]
            candidate_profile = score.user_b if str(score.user_a_id) == uid else score.user_a
            item = _build_match_item(score, uid, candidate_profile)
            if item:
                items.append(item)

        return Response({
            "results": items,
            "total_unseen": len(unseen_candidates),
            "page": page,
            "page_size": page_size,
        })


class MatchDecideView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        request=DecisionSerializer,
        responses={204: None},
        summary="Record accept/reject decision on a match",
    )
    def post(self, request, profile_id):
        try:
            profile = request.user.profile
        except Exception:
            return Response({"detail": "Complete onboarding first."}, status=400)

        serializer = DecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.profiles.models import Profile as ProfileModel
        try:
            candidate = ProfileModel.objects.get(user_id=profile_id)
        except ProfileModel.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=404)

        uid = str(profile.user_id)
        cid = str(profile_id)

        UserMatchDecision.objects.update_or_create(
            user_id=uid,
            candidate_id=cid,
            defaults={"decision": serializer.validated_data["decision"]},
        )

        # Update Bloom filter
        add_decision(uid, cid)

        return Response(status=status.HTTP_204_NO_CONTENT)


class MatchDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses=MatchDetailSerializer, summary="Get full match detail")
    def get(self, request, profile_id):
        try:
            profile = request.user.profile
        except Exception:
            return Response({"detail": "Complete onboarding first."}, status=400)

        uid = str(profile.user_id)
        cid = str(profile_id)
        uid_a, uid_b = sorted([uid, cid])

        try:
            score = CompatibilityScore.objects.select_related(
                "user_a__user", "user_b__user",
                "user_a__birth_chart", "user_b__birth_chart",
            ).get(user_a_id=uid_a, user_b_id=uid_b)
        except CompatibilityScore.DoesNotExist:
            return Response({"detail": "No compatibility score found."}, status=404)

        candidate_profile = score.user_b if uid_a == uid else score.user_a

        photos = [img.get_url() for img in candidate_profile.images.all()]
        chart = getattr(candidate_profile, "birth_chart", None)

        data = {
            "profile_id": candidate_profile.user_id,
            "name": candidate_profile.name,
            "age": candidate_profile.age,
            "city": candidate_profile.current_city,
            "bio": candidate_profile.bio,
            "email": candidate_profile.user.email,
            "photos": photos,
            "rashi_name": chart.rashi_name if chart else "",
            "nakshatra_name": chart.nakshatra_name if chart else "",
            "gana": chart.gana if chart else "",
            "nadi": chart.nadi if chart else "",
            "is_manglik": chart.is_manglik if chart else None,
            "guna_milan_total": score.guna_milan_total,
            "overall_score": score.overall_score,
            "is_manglik_compatible": score.is_manglik_compatible,
            "narrative": score.narrative,
            "score_breakdown": {
                "varna": score.varna_score,
                "vasya": score.vasya_score,
                "tara": score.tara_score,
                "yoni": score.yoni_score,
                "graha_maitri": score.graha_maitri_score,
                "gana": score.gana_score,
                "bhakoot": score.bhakoot_score,
                "nadi": score.nadi_score,
            },
        }
        return Response(MatchDetailSerializer(data).data)


def _build_match_item(score, current_uid: str, candidate_profile) -> dict | None:
    primary_img = candidate_profile.images.filter(is_primary=True).first()
    photo_url = primary_img.get_url() if primary_img else None

    return {
        "profile_id": candidate_profile.user_id,
        "name": candidate_profile.name,
        "age": candidate_profile.age,
        "city": candidate_profile.current_city,
        "bio_snippet": candidate_profile.bio[:120] if candidate_profile.bio else "",
        "primary_photo_url": photo_url,
        "email": candidate_profile.user.email,
        "guna_milan_total": score.guna_milan_total,
        "overall_score": score.overall_score,
        "is_manglik_compatible": score.is_manglik_compatible,
        "narrative": score.narrative,
        "score_breakdown": {
            "varna": score.varna_score,
            "vasya": score.vasya_score,
            "tara": score.tara_score,
            "yoni": score.yoni_score,
            "graha_maitri": score.graha_maitri_score,
            "gana": score.gana_score,
            "bhakoot": score.bhakoot_score,
            "nadi": score.nadi_score,
        },
    }
