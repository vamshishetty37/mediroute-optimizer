import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const SCENARIOS_FILE = path.join(process.cwd(), "scenarios.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure scenarios.json exists
  try {
    await fs.access(SCENARIOS_FILE);
  } catch {
    try {
      await fs.writeFile(SCENARIOS_FILE, JSON.stringify([], null, 2));
    } catch (e) {
      console.warn("Could not create scenarios.json", e);
    }
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Scenario Storage Routes
  app.get("/api/scenarios", async (req, res) => {
    try {
      const data = await fs.readFile(SCENARIOS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read scenarios" });
    }
  });

  app.post("/api/scenarios", async (req, res) => {
    try {
      const { name, selectedHospitalIds, selectedSupplyIds, selectedVehicleId } = req.body;
      let scenarios = [];
      try {
        const data = await fs.readFile(SCENARIOS_FILE, "utf-8");
        scenarios = JSON.parse(data);
      } catch (e) {
        // file doesn't exist or is invalid
      }
      
      const newScenario = {
        id: Date.now().toString(),
        name,
        selectedHospitalIds,
        selectedSupplyIds,
        selectedVehicleId,
        createdAt: new Date().toISOString()
      };
      
      scenarios.push(newScenario);
      await fs.writeFile(SCENARIOS_FILE, JSON.stringify(scenarios, null, 2));
      res.json(newScenario);
    } catch (error) {
      res.status(500).json({ error: "Failed to save scenario" });
    }
  });

  app.delete("/api/scenarios/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let scenarios = [];
      try {
        const data = await fs.readFile(SCENARIOS_FILE, "utf-8");
        scenarios = JSON.parse(data);
      } catch (e) {
        // ignore
      }
      scenarios = scenarios.filter((s: any) => s.id !== id);
      await fs.writeFile(SCENARIOS_FILE, JSON.stringify(scenarios, null, 2));
      res.json({ status: "deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });

  // Gemini Proxy Endpoint
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, systemInstruction, responseMimeType } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key not configured on server" });
      }

      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          systemInstruction: systemInstruction,
          responseMimeType: responseMimeType
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate content" });
    }
  });

  // Serve frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running as a Vercel function
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default appPromise;
