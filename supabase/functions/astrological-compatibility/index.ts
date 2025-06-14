
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BirthData {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}

interface CompatibilityRequest {
  userProfile: BirthData;
  targetProfiles: BirthData[];
}

interface SingleCompatibilityRequest {
  userProfile: BirthData;
  targetProfile: BirthData;
}

interface CompatibilityResponse {
  score: number;
  description: string;
}

interface BatchCompatibilityResponse {
  results: Array<{
    targetName: string;
    score: number;
    description: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2));

    // Check if this is a batch request or single request
    const isBatchRequest = requestBody.targetProfiles && Array.isArray(requestBody.targetProfiles);
    
    if (isBatchRequest) {
      return await handleBatchCompatibility(requestBody as CompatibilityRequest);
    } else {
      return await handleSingleCompatibility(requestBody as SingleCompatibilityRequest);
    }

  } catch (error) {
    console.error('Error in astrological-compatibility function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      score: 0,
      description: 'Unable to calculate compatibility at this time.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleBatchCompatibility(request: CompatibilityRequest): Promise<Response> {
  const { userProfile, targetProfiles } = request;
  
  if (!userProfile || !targetProfiles || targetProfiles.length === 0) {
    throw new Error('Invalid batch request format. Expected userProfile and targetProfiles array');
  }

  console.log(`Processing batch compatibility for ${userProfile.name} with ${targetProfiles.length} profiles`);

  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Create detailed prompt for batch analysis
  const prompt = `You are a professional Vedic astrologer with expertise in Kundli matching and compatibility analysis. Analyze the astrological compatibility between one primary person and multiple potential partners.

PRIMARY PERSON:
- Name: ${userProfile.name}
- Date of Birth: ${userProfile.dateOfBirth}
- Time of Birth: ${userProfile.timeOfBirth}
- Place of Birth: ${userProfile.placeOfBirth}

POTENTIAL PARTNERS:
${targetProfiles.map((profile, index) => `
${index + 1}. Name: ${profile.name}
   Date of Birth: ${profile.dateOfBirth}
   Time of Birth: ${profile.timeOfBirth}
   Place of Birth: ${profile.placeOfBirth}`).join('')}

For each potential partner, perform a comprehensive Vedic astrological analysis considering:

1. **Guna Milan (Ashtakoot)**: Analyze all 8 compatibility factors
2. **Manglik Dosha**: Check for Mars-related incompatibilities
3. **Planetary Positions**: Examine Venus, Mars, Jupiter positions
4. **Nakshatras**: Birth star compatibility
5. **Dasha Periods**: Current and future planetary periods
6. **7th House Analysis**: Marriage house examination
7. **Navamsa Chart**: Divisional chart for marriage
8. **Longevity and Health**: Overall life compatibility

**IMPORTANT SCORING GUIDELINES:**
- Be realistic and varied in scoring (use full range 15-95)
- Scores of 80+ should be rare and only for exceptional matches
- Average compatibility should be 45-65
- Poor matches should score 15-40
- Good matches should score 65-80
- Exceptional matches should score 80-95

Search for additional information about the birth places, cultural backgrounds, and any relevant astrological significance of their locations to provide more accurate analysis.

Return your analysis as a JSON object with this exact structure:
{
  "results": [
    {
      "targetName": "Partner Name",
      "score": numerical_score_between_15_and_95,
      "description": "4-5 detailed sentences about compatibility, challenges, and relationship prospects"
    }
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anthropicApiKey}`,
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      tools: [
        {
          name: "web_search",
          description: "Search the web for information about astrological significance of places, cultural practices, or compatibility factors",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for astrological or cultural information"
              }
            },
            required: ["query"]
          }
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', errorText);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('Claude batch response:', data);

  const content = data.content[0].text;
  
  let batchResult: BatchCompatibilityResponse;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    batchResult = JSON.parse(jsonString);
    
    // Validate and clean up results
    if (batchResult.results) {
      batchResult.results = batchResult.results.map(result => ({
        ...result,
        score: Math.max(15, Math.min(95, result.score || 50))
      }));
    }
  } catch (parseError) {
    console.error('Failed to parse Claude batch response as JSON:', content);
    // Fallback: create default results
    batchResult = {
      results: targetProfiles.map(profile => ({
        targetName: profile.name,
        score: 50,
        description: "Unable to calculate detailed compatibility at this time. Please try again."
      }))
    };
  }

  console.log('Final batch compatibility result:', batchResult);

  return new Response(JSON.stringify(batchResult), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSingleCompatibility(request: SingleCompatibilityRequest): Promise<Response> {
  // Handle legacy single compatibility requests
  let userProfile: BirthData;
  let targetProfile: BirthData;

  if (request.userProfile && request.targetProfile) {
    userProfile = request.userProfile;
    targetProfile = request.targetProfile;
  } else if ((request as any).user1 && (request as any).user2) {
    userProfile = (request as any).user1;
    targetProfile = (request as any).user2;
  } else {
    throw new Error('Invalid request format. Expected userProfile/targetProfile or user1/user2');
  }

  // Validate profiles
  const validateProfile = (profile: any, profileName: string): BirthData => {
    if (!profile || !profile.name || !profile.dateOfBirth || !profile.timeOfBirth || !profile.placeOfBirth) {
      throw new Error(`${profileName} is missing required fields`);
    }
    return profile as BirthData;
  };

  userProfile = validateProfile(userProfile, 'userProfile');
  targetProfile = validateProfile(targetProfile, 'targetProfile');

  console.log('Processing single compatibility for:', userProfile.name, 'and', targetProfile.name);

  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `You are a professional Vedic astrologer with deep expertise in Kundli matching. Analyze the astrological compatibility between these two individuals for marriage.

PERSON 1:
- Name: ${userProfile.name}
- Date of Birth: ${userProfile.dateOfBirth}
- Time of Birth: ${userProfile.timeOfBirth}
- Place of Birth: ${userProfile.placeOfBirth}

PERSON 2:
- Name: ${targetProfile.name}
- Date of Birth: ${targetProfile.dateOfBirth}
- Time of Birth: ${targetProfile.timeOfBirth}
- Place of Birth: ${targetProfile.placeOfBirth}

Perform a comprehensive Vedic astrological analysis including:
1. Guna Milan (Ashtakoot matching) - all 8 factors
2. Manglik Dosha analysis for both charts
3. Planetary positions (especially Venus, Mars, Jupiter)
4. Nakshatra compatibility
5. Dasha analysis and timing
6. 7th house examination for marriage
7. Navamsa chart compatibility

**CRITICAL SCORING INSTRUCTIONS:**
- Use realistic, varied scores between 15-95
- Most matches should score 45-65 (average compatibility)
- Only truly exceptional matches should score 80+
- Poor matches should score 15-40
- Consider actual astrological factors, not just positive bias

Search for cultural and astrological significance of their birth places to enhance accuracy.

Return JSON: {"score": number_between_15_and_95, "description": "4-5_detailed_sentences"}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anthropicApiKey}`,
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      tools: [
        {
          name: "web_search",
          description: "Search for astrological information about places, compatibility factors, or cultural practices",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for astrological information"
              }
            },
            required: ["query"]
          }
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', errorText);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('Claude single response:', data);

  const content = data.content[0].text;
  
  let compatibilityResult: CompatibilityResponse;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    compatibilityResult = JSON.parse(jsonString);
  } catch (parseError) {
    console.error('Failed to parse Claude response as JSON:', content);
    const scoreMatch = content.match(/score["\s]*:[\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    
    compatibilityResult = {
      score,
      description: content.length > 500 ? content.substring(0, 500) + '...' : content
    };
  }

  // Validate score is within realistic range
  if (compatibilityResult.score < 15 || compatibilityResult.score > 95) {
    compatibilityResult.score = Math.max(15, Math.min(95, compatibilityResult.score));
  }

  console.log('Final single compatibility result:', compatibilityResult);

  return new Response(JSON.stringify(compatibilityResult), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
