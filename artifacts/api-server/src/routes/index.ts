import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkinsRouter from "./checkins";
import communityRouter from "./community";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkinsRouter);
router.use(communityRouter);

export default router;
