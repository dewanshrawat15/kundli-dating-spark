
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
  targetProfile: BirthData;
}

interface CompatibilityResponse {
  score: number;
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2));

    // Handle both old (user1/user2) and new (userProfile/targetProfile) parameter formats
    let userProfile: BirthData;
    let targetProfile: BirthData;

    if (requestBody.userProfile && requestBody.targetProfile) {
      userProfile = requestBody.userProfile;
      targetProfile = requestBody.targetProfile;
    } else if (requestBody.user1 && requestBody.user2) {
      userProfile = requestBody.user1;
      targetProfile = requestBody.user2;
    } else {
      console.error('Invalid request format. Expected userProfile/targetProfile or user1/user2');
      throw new Error('Invalid request format. Expected userProfile/targetProfile or user1/user2');
    }

    // Validate that both profiles have required fields
    const validateProfile = (profile: any, profileName: string): BirthData => {
      if (!profile) {
        throw new Error(`${profileName} is missing`);
      }
      if (!profile.name || typeof profile.name !== 'string') {
        throw new Error(`${profileName} name is missing or invalid`);
      }
      if (!profile.dateOfBirth || typeof profile.dateOfBirth !== 'string') {
        throw new Error(`${profileName} dateOfBirth is missing or invalid`);
      }
      if (!profile.timeOfBirth || typeof profile.timeOfBirth !== 'string') {
        throw new Error(`${profileName} timeOfBirth is missing or invalid`);
      }
      if (!profile.placeOfBirth || typeof profile.placeOfBirth !== 'string') {
        throw new Error(`${profileName} placeOfBirth is missing or invalid`);
      }
      return profile as BirthData;
    };

    userProfile = validateProfile(userProfile, 'userProfile');
    targetProfile = validateProfile(targetProfile, 'targetProfile');

    console.log('Processing compatibility for:', userProfile.name, 'and', targetProfile.name);

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const prompt = `Act as an Indian astrologer, and read the kundli's of both partners:

Partner 1:
- Name: ${userProfile.name}
- Date of Birth: ${userProfile.dateOfBirth}
- Time of Birth: ${userProfile.timeOfBirth}
- Place of Birth: ${userProfile.placeOfBirth}

Partner 2:
- Name: ${targetProfile.name}
- Date of Birth: ${targetProfile.dateOfBirth}
- Time of Birth: ${targetProfile.timeOfBirth}
- Place of Birth: ${targetProfile.placeOfBirth}

If these partners were to start dating with the intent to marry, how good would be a match? Generate a score from 0-100. Also, write 4-5 lines of how the relationship might go. Return this as a JSON object response with keys "score" and "description".`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
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
    console.log('Claude response:', data);

    const content = data.content[0].text;
    
    // Try to parse JSON from Claude's response
    let compatibilityResult: CompatibilityResponse;
    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      compatibilityResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', content);
      // Fallback: try to extract score and description manually
      const scoreMatch = content.match(/score["\s]*:[\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
      
      compatibilityResult = {
        score,
        description: content.length > 500 ? content.substring(0, 500) + '...' : content
      };
    }

    // Validate score is within range
    if (compatibilityResult.score < 0 || compatibilityResult.score > 100) {
      compatibilityResult.score = Math.max(0, Math.min(100, compatibilityResult.score));
    }

    console.log('Final compatibility result:', compatibilityResult);

    return new Response(JSON.stringify(compatibilityResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
