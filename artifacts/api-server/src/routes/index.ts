import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkinsRouter from "./checkins";
import communityRouter from "./community";
import meditationRouter from "./meditation";
import goalsRouter from "./goals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkinsRouter);
router.use(communityRouter);
router.use(meditationRouter);
router.use(goalsRouter);

export default router;
