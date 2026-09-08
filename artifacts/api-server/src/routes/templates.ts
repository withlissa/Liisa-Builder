import { Router } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";

const router = Router();

const TEMPLATE_FILES: Record<string, string> = {
  lumina: "Pasted-You-are-given-a-task-to-integrate-an-existing-React-com_1788781978684.txt",
  performance: "Pasted-Build-ONE-standalone-file-index-html-no-frameworks-no-b_1788782212632.txt",
  oceanpulse: "Pasted-Build-a-single-self-contained-HTML-file-one-file-inline_1788782225497.txt",
  heritage: "Pasted-Create-exactly-ONE-file-named-index-html-in-the-project_1788782236408.txt",
  junglemind: "Pasted-Build-a-single-standalone-production-ready-HTML-file-al_1788782245289.txt",
  nexeus: "Pasted-Build-a-single-file-standalone-HTML-page-index-html-tha_1788782288543.txt",
};

router.get("/templates/:id/prompt", async (req, res) => {
  const filename = TEMPLATE_FILES[req.params.id];
  if (!filename) {
    res.status(404).json({ message: "Template not found" });
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), "attached_assets", filename),
    path.resolve(process.cwd(), "../../attached_assets", filename),
  ];

  for (const candidate of candidates) {
    try {
      const prompt = await readFile(candidate, "utf8");
      res.type("text/plain").send(prompt);
      return;
    } catch {
      // Try the next workspace layout.
    }
  }

  res.status(404).json({ message: "Template prompt is unavailable" });
});

export default router;