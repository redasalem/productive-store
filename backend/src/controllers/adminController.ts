import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import ImageKit from "@imagekit/nodejs";
import { db } from "../db";
import { products } from "../db/schema";
import { getLocalUser } from "../lib/user";
import { isAdmin } from "../lib/roles";
import { getEnv } from "../lib/env";
import { eq, desc } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  ImageKit client (lazy singleton)                                  */
/* ------------------------------------------------------------------ */

let _ik: InstanceType<typeof ImageKit> | null = null;

function getImageKit() {
  if (!_ik) {
    const env = getEnv();
    _ik = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });
  }
  return _ik;
}

/* ------------------------------------------------------------------ */
/*  Middleware – require admin role                                    */
/* ------------------------------------------------------------------ */

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await getLocalUser(auth.userId);
    if (!user || !isAdmin(user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  } catch (e) {
    next(e);
  }
}

/* ------------------------------------------------------------------ */
/*  GET /admin/imagekit/auth                                          */
/* ------------------------------------------------------------------ */

export async function getImageKitAuth(_req: Request, res: Response, next: NextFunction) {
  try {
    const ik = getImageKit();
    const { token, expire, signature } = ik.helper.getAuthenticationParameters();
    const env = getEnv();
    res.json({ token, expire, signature, publicKey: env.IMAGEKIT_PUBLIC_KEY });
  } catch (e) {
    next(e);
  }
}

/* ------------------------------------------------------------------ */
/*  GET /admin/products                                               */
/* ------------------------------------------------------------------ */

export async function listAdminProducts(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    res.json({ products: rows });
  } catch (e) {
    next(e);
  }
}

/* ------------------------------------------------------------------ */
/*  POST /admin/products                                              */
/* ------------------------------------------------------------------ */

export async function createAdminProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, slug, category, description, priceCents, currency, imageUrl, imageKitFileId, active } = req.body;

    const [created] = await db
      .insert(products)
      .values({
        name,
        slug,
        category: category ?? "General",
        description: description ?? "",
        priceCents: Number(priceCents),
        currency: currency ?? "usd",
        imageUrl: imageUrl ?? null,
        imageKitFileId: imageKitFileId ?? null,
        active: active ?? true,
      })
      .returning();

    res.status(201).json({ product: created });
  } catch (e) {
    next(e);
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /admin/products/:id                                         */
/* ------------------------------------------------------------------ */

export async function updateAdminProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { name, slug, category, description, priceCents, currency, imageUrl, imageKitFileId, active } = req.body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (priceCents !== undefined) updates.priceCents = Number(priceCents);
    if (currency !== undefined) updates.currency = currency;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (imageKitFileId !== undefined) updates.imageKitFileId = imageKitFileId;
    if (active !== undefined) updates.active = active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Product not found" });

    res.json({ product: updated });
  } catch (e) {
    next(e);
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /admin/products/:id                                        */
/* ------------------------------------------------------------------ */

export async function deleteAdminProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deleted) return res.status(404).json({ error: "Product not found" });

    res.json({ product: deleted });
  } catch (e) {
    next(e);
  }
}
