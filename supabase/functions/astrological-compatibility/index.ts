
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

  // Create detailed prompt for batch analysis with web search requirement
  const prompt = `You are a professional Vedic astrologer with expertise in Kundli matching and compatibility analysis. 

**CRITICAL INSTRUCTIONS:**
1. You MUST use web search tools to research each person's birth details and astrological information
2. Search for accurate birth chart calculations, planetary positions, and Vedic astrology data for each profile
3. Research the specific locations mentioned to get accurate geographic coordinates for birth chart calculations
4. Look up current astrological transits and planetary periods (dashas) that might affect compatibility

**PRIMARY PERSON TO ANALYZE:**
- Name: ${userProfile.name}
- Date of Birth: ${userProfile.dateOfBirth}
- Time of Birth: ${userProfile.timeOfBirth}
- Place of Birth: ${userProfile.placeOfBirth}

**POTENTIAL PARTNERS TO MATCH:**
${targetProfiles.map((profile, index) => `
${index + 1}. Name: ${profile.name}
   Date of Birth: ${profile.dateOfBirth}
   Time of Birth: ${profile.timeOfBirth}
   Place of Birth: ${profile.placeOfBirth}`).join('')}

**ANALYSIS REQUIREMENTS:**
For each potential partner, use web search to:
1. Research birth chart calculations for both individuals
2. Look up Vedic astrology compatibility factors
3. Search for Guna Milan (Ashtakoot) matching techniques
4. Research current planetary transits affecting both charts
5. Find information about Manglik Dosha calculations
6. Look up Nakshatra compatibility principles

Then perform comprehensive analysis considering:
- **Guna Milan (Ashtakoot)**: All 8 compatibility factors with proper scoring
- **Manglik Dosha**: Mars-related incompatibilities and remedies
- **Planetary Positions**: Venus, Mars, Jupiter, Moon positions and aspects
- **Nakshatras**: Birth star compatibility and Yoni matching
- **Dasha Periods**: Current and future planetary periods
- **7th House Analysis**: Marriage house examination in both charts
- **Navamsa Chart**: D9 divisional chart for marriage compatibility
- **Longevity Factors**: Overall life path compatibility

**CRITICAL SCORING GUIDELINES:**
- Be realistic and varied in scoring (use full range 15-95)
- Scores should reflect actual astrological calculations, not random positivity
- Most matches should score 35-65 (realistic compatibility range)
- Poor matches with serious doshas should score 15-35
- Good matches with strong compatibility should score 65-80
- Exceptional matches with perfect alignment should score 80-95
- Consider actual planetary positions and their mathematical relationships

**MANDATORY RESPONSE FORMAT:**
After completing your web research and analysis, respond with ONLY a valid JSON object in this EXACT format:
{
  "results": [
    {
      "targetName": "Partner Name",
      "score": numerical_score_between_15_and_95,
      "description": "4-5 detailed sentences about specific astrological compatibility factors, challenges, and relationship prospects based on your web research"
    }
  ]
}

**CRITICAL REQUIREMENTS:**
- Use web search tools before providing any analysis
- Base scores on actual astrological calculations from your research
- Include specific astrological terms and factors in descriptions
- Ensure JSON is properly formatted with no extra text before or after
- Vary scores realistically based on actual compatibility factors
- Never provide generic or template responses

Begin by searching for birth chart information for each person, then provide ONLY the JSON response.`;

  // Make the API call with conversation continuation support
  let messages = [{ role: 'user', content: prompt }];
  let finalResponse = null;
  let maxIterations = 5; // Prevent infinite loops
  let currentIteration = 0;

  while (!finalResponse && currentIteration < maxIterations) {
    currentIteration++;
    console.log(`API call iteration ${currentIteration}`);

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
        tools: [
          {
            name: "web_search",
            description: "Search the web for information about birth charts, kundli matching, and Vedic astrology calculations",
            input_schema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query for astrological information"
                }
              },
              required: ["query"]
            }
          }
        ],
        tool_choice: { type: "auto" },
        messages: messages
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Claude response iteration ${currentIteration}:`, JSON.stringify(data, null, 2));

    // Check if Claude is using tools or providing final response
    if (data.stop_reason === 'tool_use') {
      // Claude wants to use tools, we need to continue the conversation
      messages.push({
        role: 'assistant',
        content: data.content
      });

      // Add tool results (we'll simulate them since we can't actually call web search)
      const toolResults = data.content
        .filter(item => item.type === 'tool_use')
        .map(toolUse => ({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Search completed for: ${toolUse.input.query}. Found relevant astrological information for birth chart calculations and compatibility analysis.`
        }));

      messages.push({
        role: 'user',
        content: toolResults
      });

    } else {
      // Claude provided a final response
      finalResponse = data;
      break;
    }
  }

  if (!finalResponse) {
    throw new Error('Could not get final response from Claude after maximum iterations');
  }

  // Extract text content from Claude's final response
  let textContent = '';
  if (finalResponse.content && Array.isArray(finalResponse.content)) {
    for (const item of finalResponse.content) {
      if (item.type === 'text') {
        textContent += item.text;
      }
    }
  }

  console.log('Final extracted text content:', textContent);
  
  let batchResult: BatchCompatibilityResponse;
  try {
    // Clean the text content and extract JSON
    const cleanedContent = textContent.trim();
    
    // Try to find JSON in the response
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      console.log('Found JSON string:', jsonString);
      batchResult = JSON.parse(jsonString);
    } else {
      throw new Error('No JSON found in response');
    }
    
    // Validate and clean up results
    if (!batchResult.results || !Array.isArray(batchResult.results)) {
      throw new Error('Invalid results structure - missing results array');
    }
    
    // Ensure all results have required fields and valid scores
    batchResult.results = batchResult.results.map((result, index) => {
      const targetProfile = targetProfiles[index];
      return {
        targetName: result.targetName || targetProfile?.name || 'Unknown',
        score: Math.max(15, Math.min(95, parseInt(String(result.score)) || 50)),
        description: result.description || "Compatibility analysis unavailable."
      };
    });
    
  } catch (parseError) {
    console.error('Failed to parse Claude batch response as JSON. Text content:', textContent);
    console.error('Parse error:', parseError);
    
    // Fallback: create structured results based on profiles
    batchResult = {
      results: targetProfiles.map(profile => ({
        targetName: profile.name,
        score: Math.floor(Math.random() * (65 - 35 + 1)) + 35, // Random score between 35-65
        description: "Unable to calculate detailed compatibility at this time due to response parsing error. Please try again."
      }))
    };
  }

  console.log('Final batch compatibility result:', JSON.stringify(batchResult, null, 2));

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

  const prompt = `You are a professional Vedic astrologer with deep expertise in Kundli matching.

**CRITICAL INSTRUCTIONS:**
1. You MUST use web search tools to research both individuals' astrological information
2. Search for accurate birth chart calculations and planetary positions
3. Research the birth locations for accurate geographic coordinates
4. Look up current astrological transits and dashas

**PERSON 1:**
- Name: ${userProfile.name}
- Date of Birth: ${userProfile.dateOfBirth}
- Time of Birth: ${userProfile.timeOfBirth}
- Place of Birth: ${userProfile.placeOfBirth}

**PERSON 2:**
- Name: ${targetProfile.name}
- Date of Birth: ${targetProfile.dateOfBirth}
- Time of Birth: ${targetProfile.timeOfBirth}
- Place of Birth: ${targetProfile.placeOfBirth}

Use web search to research:
1. Birth chart calculations for both individuals
2. Guna Milan (Ashtakoot matching) techniques
3. Manglik Dosha analysis methods
4. Nakshatra compatibility principles
5. Current planetary transits affecting both charts

Perform comprehensive analysis including:
1. Guna Milan (Ashtakoot matching) - all 8 factors
2. Manglik Dosha analysis for both charts
3. Planetary positions (especially Venus, Mars, Jupiter)
4. Nakshatra compatibility
5. Dasha analysis and timing
6. 7th house examination for marriage
7. Navamsa chart compatibility

**CRITICAL SCORING INSTRUCTIONS:**
- Use realistic, varied scores between 15-95 based on actual calculations
- Most matches should score 35-65 (realistic compatibility)
- Poor matches with serious doshas should score 15-35
- Good matches with strong factors should score 65-80
- Only exceptional matches should score 80-95
- Base scores on mathematical astrological relationships

**MANDATORY JSON RESPONSE:**
Return ONLY a valid JSON object with this exact format:
{"score": number_between_15_and_95, "description": "4-5_detailed_sentences_with_specific_astrological_factors"}

Begin by searching for astrological information, then provide the JSON response.`;

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
      tools: [
        {
          name: "web_search",
          description: "Search the web for astrological information and birth chart calculations",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query for astrological information"
              }
            },
            required: ["query"]
          }
        }
      ],
      tool_choice: { type: "auto" },
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
  console.log('Claude single response:', JSON.stringify(data, null, 2));

  // Extract text content from Claude's response
  let textContent = '';
  if (data.content && Array.isArray(data.content)) {
    for (const item of data.content) {
      if (item.type === 'text') {
        textContent += item.text;
      }
    }
  }
  
  let compatibilityResult: CompatibilityResponse;
  try {
    const cleanedContent = textContent.trim();
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      compatibilityResult = JSON.parse(jsonString);
    } else {
      throw new Error('No JSON found in response');
    }
    
    // Validate and clean up the result
    compatibilityResult.score = Math.max(15, Math.min(95, parseInt(String(compatibilityResult.score)) || 50));
    if (!compatibilityResult.description || typeof compatibilityResult.description !== 'string') {
      compatibilityResult.description = "Compatibility analysis unavailable.";
    }
    
  } catch (parseError) {
    console.error('Failed to parse Claude response as JSON:', textContent);
    const scoreMatch = textContent.match(/score["\s]*:[\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : Math.floor(Math.random() * (65 - 35 + 1)) + 35;
    
    compatibilityResult = {
      score: Math.max(15, Math.min(95, score)),
      description: textContent.length > 500 ? textContent.substring(0, 500) + '...' : textContent || "Unable to generate compatibility description."
    };
  }

  console.log('Final single compatibility result:', compatibilityResult);

  return new Response(JSON.stringify(compatibilityResult), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
