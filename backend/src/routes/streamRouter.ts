import { Router } from "express";
import { createStreamToken } from "../controlers/streamController";

const router: Router = Router();

router.post("/token", createStreamToken);

export default router;