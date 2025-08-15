// import express from 'express';
// import axios from 'axios';
// import dotenv from 'dotenv';
// import { Spring } from '../models/Spring-model.js';

// dotenv.config();
// const router = express.Router();

// // Utility: Fuzzy match spring name/district (basic check)
// function findRelevantSprings(springs, userMessage) {
//   const lowerMsg = userMessage.toLowerCase();
//   return springs.filter(spring => {
//     return (
//       lowerMsg.includes(spring.name.toLowerCase()) ||
//       lowerMsg.includes(spring.district.toLowerCase())
//     );
//   });
// }

// router.post('/', async (req, res) => {
//   const { message } = req.body;
  
//   // Validate input
//   if (!message) {
//     return res.status(400).json({ error: "Message is required" });
//   }

//   try {
//     console.log("ChatBot Request:", message);
    
//     // Step 1: Fetch all springs
//     const allSprings = await Spring.find({});
//     console.log(`Found ${allSprings.length} springs in database`);

//     // Step 2: Match input to springs (by name or district)
//     const relevantSprings = findRelevantSprings(allSprings, message);
//     console.log(`Found ${relevantSprings.length} relevant springs for query`);

//     // Step 3: Format spring info to include in prompt
//     let springContext = "No matching springs found.";
//     if (relevantSprings.length > 0) {
//       springContext = relevantSprings
//         .map(spring => {
//           return `Spring Name: ${spring.name}, District: ${spring.district}, Status: ${spring.status}, Flow Rate: ${spring.flowRate} L/min, Usage: ${spring.usage}`;
//         })
//         .join("\n");
//     }

//     // Verify API key is available
//     if (!process.env.OPENROUTER_API_KEY) {
//       console.error("OPENROUTER_API_KEY is missing in environment variables");
//       return res.status(500).json({ error: "API configuration error" });
//     }

//     // Step 4: Send to OpenRouter
//     console.log("Sending request to OpenRouter API...");
//     try {
//       // Updated with valid model IDs - using a primary model with fallbacks
//       const aiResponse = await axios.post(
//         'https://openrouter.ai/api/v1/chat/completions',
//         {
//           // Updated model ID format - using a currently available model
//           model: "openai/gpt-3.5-turbo", // Primary model choice
//           // Fallback models if you want to try alternatives:
//           // model: "anthropic/claude-instant-v1",
//           // model: "google/palm-2-chat-bison",
//           // model: "meta-llama/llama-2-13b-chat",
//           messages: [
//             {
//               role: "system",
//               content: `You are a helpful assistant for the ReSprings platform. Use the following spring data if it matches the user's query:\n${springContext}`
//             },
//             { role: "user", content: message }
//           ]
//         },
//         {
//           headers: {
//             "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
//             "Content-Type": "application/json",
//             "HTTP-Referer": process.env.APP_URL || "http://localhost:3000", // Required by OpenRouter
//             "X-Title": "ReSprings Chatbot" // Optional but recommended
//           },
//           timeout: 30000 // 30 second timeout
//         }
//       );

//       console.log("OpenRouter API response received");
//       const reply = aiResponse.data.choices[0].message.content;
//       res.json({ reply });
//     } catch (apiError) {
//       // Detailed API error logging
//       console.error("OpenRouter API Error:");
//       if (apiError.response) {
//         // The request was made and the server responded with a status code
//         // that falls out of the range of 2xx
//         console.error("Status:", apiError.response.status);
//         console.error("Data:", JSON.stringify(apiError.response.data, null, 2));
//         console.error("Headers:", apiError.response.headers);
//         return res.status(apiError.response.status).json({ 
//           error: "AI service error", 
//           details: apiError.response.data?.error?.message || "Unknown API error"
//         });
//       } else if (apiError.request) {
//         // The request was made but no response was received
//         console.error("No response received:", apiError.request);
//         return res.status(504).json({ error: "AI service timeout" });
//       } else {
//         // Something happened in setting up the request that triggered an Error
//         console.error("Error setting up request:", apiError.message);
//         return res.status(500).json({ error: "Request configuration error" });
//       }
//     }
//   } catch (error) {
//     console.error("Chatbot General Error:", error);
//     res.status(500).json({ error: "Failed to process chatbot request." });
//   }
// });

// export default router;



import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { Spring } from '../models/Spring-model.js';

dotenv.config();
const router = express.Router();

// Improved spring search function that handles multilingual queries
function findRelevantSprings(springs, userMessage) {
  // Convert message to lowercase for case-insensitive matching
  const lowerMsg = userMessage.toLowerCase();
  
  // Extract potential spring names from the message
  // This regex looks for words that might be proper nouns or place names
  const potentialNames = lowerMsg.match(/\b[a-z]+\b/gi) || [];
  
  // Create a list of all spring names and districts for matching
  const springKeywords = springs.reduce((keywords, spring) => {
    // Add spring name and district to keywords
    keywords.push(spring.name.toLowerCase());
    keywords.push(spring.district.toLowerCase());
    
    // Also add individual words from multi-word names
    spring.name.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) { // Only add words with more than 2 characters
        keywords.push(word);
      }
    });
    
    return keywords;
  }, []);
  
  // Find matches between potential names and spring keywords
  const matchedKeywords = potentialNames.filter(name => 
    springKeywords.some(keyword => keyword.includes(name) || name.includes(keyword))
  );
  
  console.log("Potential spring names extracted:", potentialNames);
  console.log("Matched keywords:", matchedKeywords);
  
  // If we found matches, filter springs based on these matches
  if (matchedKeywords.length > 0) {
    return springs.filter(spring => {
      const springNameLower = spring.name.toLowerCase();
      const districtLower = spring.district.toLowerCase();
      
      return matchedKeywords.some(keyword => 
        springNameLower.includes(keyword) || 
        districtLower.includes(keyword) ||
        springNameLower.split(/\s+/).some(word => word === keyword)
      );
    });
  }
  
  // Fallback to the original method if no matches found
  return springs.filter(spring => {
    return (
      lowerMsg.includes(spring.name.toLowerCase()) ||
      lowerMsg.includes(spring.district.toLowerCase())
    );
  });
}

// Get language-specific system prompt
function getSystemPrompt(language, springContext) {
  const basePrompt = `You are a helpful assistant for the ReSprings platform. Use the following spring data if it matches the user's query:\n${springContext}\n\n`;
  
  switch (language) {
    case 'hi':
      return basePrompt + 
        "हिंदी में उत्तर दें। आप ReSprings प्लेटफॉर्म के लिए एक सहायक हैं जो पानी के स्रोतों के बारे में जानकारी प्रदान करता है। " +
        "उपयोगकर्ता के प्रश्नों का उत्तर हिंदी में दें और जहां संभव हो वहां स्प्रिंग डेटा का उपयोग करें।";
    
    case 'ne':
      return basePrompt + 
        "नेपालीमा जवाफ दिनुहोस्। तपाईं ReSprings प्लेटफर्मको लागि एक सहयोगी हुनुहुन्छ जसले पानीको स्रोतहरूको बारेमा जानकारी प्रदान गर्दछ। " +
        "प्रयोगकर्ताको प्रश्नहरूको जवाफ नेपालीमा दिनुहोस् र सम्भव भएसम्म स्प्रिंग डाटा प्रयोग गर्नुहोस्।";
    
    default: // 'en' or any other language defaults to English
      return basePrompt + 
        "Respond in English. You are an assistant for the ReSprings platform that provides information about water sources. " +
        "Answer user questions in English and use the spring data where applicable.";
  }
}

// Language detection helper (basic implementation)
function detectLanguage(text) {
  // Simple language detection based on character sets and common words
  // This is a basic implementation - for production, consider using a proper language detection library
  
  // Check for Devanagari script (used in Hindi)
  const devanagariPattern = /[\u0900-\u097F]/;
  if (devanagariPattern.test(text)) {
    // Differentiate between Hindi and Nepali (simplified)
    const nepaliIndicators = ['छ', 'को', 'मा', 'हुन्छ', 'गर्न', 'तपाईं'];
    for (const word of nepaliIndicators) {
      if (text.includes(word)) {
        return 'ne'; // Likely Nepali
      }
    }
    return 'hi'; // Likely Hindi
  }
  
  return 'en'; // Default to English
}

router.post('/', async (req, res) => {
  const { message, language } = req.body;
  
  // Validate input
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    console.log("ChatBot Request:", message);
    
    // Detect language if not explicitly provided
    const detectedLanguage = language || detectLanguage(message);
    console.log(`Language: ${detectedLanguage}`);
    
    // Step 1: Fetch all springs
    const allSprings = await Spring.find({});
    console.log(`Found ${allSprings.length} springs in database`);

    // Step 2: Match input to springs (by name or district)
    const relevantSprings = findRelevantSprings(allSprings, message);
    console.log(`Found ${relevantSprings.length} relevant springs for query`);
    
    // Log the names of found springs for debugging
    if (relevantSprings.length > 0) {
      console.log("Matched springs:", relevantSprings.map(s => s.name).join(", "));
    }

    // Step 3: Format spring info to include in prompt
    let springContext = "No matching springs found.";
    if (relevantSprings.length > 0) {
      springContext = relevantSprings
        .map(spring => {
          return `Spring Name: ${spring.name}, District: ${spring.district}, Status: ${spring.status}, Flow Rate: ${spring.flowRate} L/min, Usage: ${spring.usage}`;
        })
        .join("\n");
    }

    // Verify API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is missing in environment variables");
      return res.status(500).json({ error: "API configuration error" });
    }

    // Get language-specific system prompt
    const systemPrompt = getSystemPrompt(detectedLanguage, springContext);

    // Step 4: Send to OpenRouter API
    console.log("Sending request to OpenRouter API...");
    try {
      // Send request to OpenRouter for chat completion
      const aiResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: "openai/gpt-3.5-turbo", // Primary model choice
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            { role: "user", content: message }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000", // Required by OpenRouter
            "X-Title": "ReSprings Chatbot" // Optional but recommended
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log("OpenRouter API response received");
      const reply = aiResponse.data.choices[0].message.content;
      res.json({ 
        reply,
        language: detectedLanguage // Return the detected/used language
      });
    } catch (apiError) {
      // Detailed API error logging
      console.error("OpenRouter API Error:");
      if (apiError.response) {
        console.error("Status:", apiError.response.status);
        console.error("Data:", JSON.stringify(apiError.response.data, null, 2));
        console.error("Headers:", apiError.response.headers);
        return res.status(apiError.response.status).json({ 
          error: "AI service error", 
          details: apiError.response.data?.error?.message || "Unknown API error"
        });
      } else if (apiError.request) {
        console.error("No response received:", apiError.request);
        return res.status(504).json({ error: "AI service timeout" });
      } else {
        console.error("Error setting up request:", apiError.message);
        return res.status(500).json({ error: "Request configuration error" });
      }
    }
  } catch (error) {
    console.error("Chatbot General Error:", error);
    res.status(500).json({ error: "Failed to process chatbot request." });
  }
});

export default router;