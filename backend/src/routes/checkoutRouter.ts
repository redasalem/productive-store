import { Router } from "express";
import { createCheckout } from "../controllers/checkoutControler";



const router: Router = Router();

router.post('/', createCheckout)


export default router;