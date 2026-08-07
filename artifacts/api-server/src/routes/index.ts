import { Router, type IRouter } from "express";
import healthRouter from "./health";
import followsRouter from "./follows";
import interactionsRouter from "./interactions";
import profileRouter from "./profile";
import reviewsRouter from "./reviews";
import savedRouter from "./saved";
import serviceInteractionsRouter from "./serviceInteractions";
import vendorRouter from "./vendor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(followsRouter);
router.use(interactionsRouter);
router.use(profileRouter);
router.use(reviewsRouter);
router.use(savedRouter);
router.use(serviceInteractionsRouter);
router.use(vendorRouter);

export default router;
