import { Router } from "express";
import { getCaregories, getProductBySlug, listProducts } from "../controllers/productControler";


const router: Router = Router();

router.get("/", listProducts);
router.get("/categories", getCaregories);
router.get("/caregories", getCaregories);
router.get("/:slug", getProductBySlug);


export default router;