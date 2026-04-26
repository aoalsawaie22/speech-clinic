import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import specialistsRouter from "./specialists";
import childrenRouter from "./children";
import appointmentsRouter from "./appointments";
import sessionsRouter from "./sessions";
import exercisesRouter from "./exercises";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import achievementsRouter from "./achievements";
import messagesRouter from "./messages";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(specialistsRouter);
router.use(childrenRouter);
router.use(appointmentsRouter);
router.use(sessionsRouter);
router.use(exercisesRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);
router.use(achievementsRouter);
router.use(messagesRouter);
router.use(reportsRouter);

export default router;
