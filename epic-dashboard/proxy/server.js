import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// Allow all origins while testing; later you can restrict to your GitHub Pages origin
app.use(cors());
app.use(express.json());

app.post("/jira-search", async (req, res) => {
  try {
    const { baseUrl, email, token, jql } = req.body;

    if (!baseUrl || !email || !token) {
      return res.status(400).json({ error: "Missing baseUrl/email/token" });
    }

    const jiraUrl = baseUrl.replace(/\/$/, "") + "/rest/api/3/search";

    const jiraResp = await fetch(jiraUrl, {
      method: "POST",
      headers: {
        "Authorization":
          "Basic " + Buffer.from(email + ":" + token).toString("base64"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jql: jql || "project = PEJ AND issuetype in (Epic, Story)",
        maxResults: 1000,
        fields: [
          "summary",
          "issuetype",
          "status",
          "parent",
          "customfield_10021", // Sprint
          "customfield_10046", // Story Points
          "customfield_10553", // Product Manager
          "customfield_10718", // University Name
          "customfield_10719", // Skill Set
          "customfield_10720"  // Due Date (custom)
        ]
      })
    });

    const text = await jiraResp.text();
    res.status(jiraResp.status).send(text);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Proxy error", details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Jira proxy running on port " + PORT);
});
