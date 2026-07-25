import { Router } from "express";
import { getCaregories, getProductBySlug, listProducts } from "../controlers/productControler";


const router: Router = Router();

router.get("/",listProducts);
router.get("/caregories",getCaregories);
router.get("/:slug",getProductBySlug);


export default router;