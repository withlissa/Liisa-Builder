import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import githubRouter from "./github";
import projectsRouter from "./projects";
import templatesRouter from "./templates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(githubRouter);
router.use(projectsRouter);
router.use(templatesRouter);

export default router;
