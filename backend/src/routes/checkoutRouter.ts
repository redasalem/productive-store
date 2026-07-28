import { Router } from "express";
import { createCheckout } from "../controlers/checkoutControler";



const router: Router = Router();

router.post('/',createCheckout)


export default router;