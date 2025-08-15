import {Spring} from "../models/Spring-model.js";

// Simple intent and entity parser (basic for now)
const parseQuery = (query) => {
  const lower = query.toLowerCase();
  const entities = {};

  // Detect spring status questions
  if (lower.includes("status")) {
    entities.intent = "get_status";
  } else if (lower.includes("Dry")) {
    entities.intent = "list_springs_by_status";
    entities.status = "Dry";
  } else if (lower.includes("Active")) {
    entities.intent = "list_springs_by_status";
    entities.status = "Active";
  } else if (lower.includes("Low")) {
    entities.intent = "list_springs_by_status";
    entities.status = "Low";
  }

  // Extract district if any (add more districts here as needed)
  const districts = ["gangtok", "namchi", "mangan", "gyalshing", "rangpo"];
  for (const dist of districts) {
    if (lower.includes(dist)) {
      entities.district = dist.charAt(0).toUpperCase() + dist.slice(1);
    }
  }

  // Try to extract spring name if included
  const match = query.match(/status of ([a-zA-Z\s]+)/i);
  if (match) {
    entities.intent = "get_status_by_name";
    entities.name = match[1].trim();
  }

  return entities;
};

export const askChatbot = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ reply: "Please provide a question." });
  }

  const parsed = parseQuery(question);
  let reply = "Sorry, I couldn't understand that.";
  let springs = [];

  try {
    switch (parsed.intent) {
      case "get_status_by_name":
        const spring = await Spring.findOne({ name: new RegExp(parsed.name, "i") });
        if (spring) {
          reply = `${spring.name} is currently marked as ${spring.status} with a flow rate of ${spring.flowRate} L/min.`;
        } else {
          reply = `I couldn't find a spring named "${parsed.name}".`;
        }
        break;

      case "list_springs_by_status":
        springs = await Spring.find({ status: parsed.status });
        if (parsed.district) {
          springs = springs.filter(s => s.district === parsed.district);
        }
        reply = `Here are ${parsed.status} springs${parsed.district ? " in " + parsed.district : ""}:`;
        break;

      case "get_status":
        reply = "Please mention the spring name to check its status, e.g., 'What is the status of Bhanu Spring?'.";
        break;
    }

    res.status(200).json({ reply, springs });
  } catch (error) {
    res.status(500).json({ reply: "Something went wrong.", error: error.message });
  }
};
