import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  WISH_LIST_KV: KVNamespace;
};

type WishlistItem = {
  id: number;
  item: string;
  category: 'necessity' | 'improvement';
  desireLevel: 1 | 2 | 3;
  status: 'wanted' | 'purchased' | 'maybe_unnecessary' | 'unnecessary';
  reason: string;
  memo: string;
  score: number;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

const calculateScore = (item: Omit<WishlistItem, 'id' | 'score'>) => {
  const categoryCoefficients = {
    necessity: 1.5,
    improvement: 1.2,
  };

  const statusCoefficients = {
    wanted: 1.0,
    purchased: 0,
    maybe_unnecessary: 0.5,
    unnecessary: 0,
  };

  const score = categoryCoefficients[item.category] * item.desireLevel * statusCoefficients[item.status];
  return Math.round(score * 10) / 10; // Round to one decimal place
};

app.get('/api/wishlist', async (c) => {
  const kvValue = await c.env.WISH_LIST_KV.get('wishlist');
  const wishlist = kvValue ? JSON.parse(kvValue) : [];
  return c.json(wishlist);
});

app.post('/api/wishlist', async (c) => {
  const newItemData = await c.req.json();

  const kvValue = await c.env.WISH_LIST_KV.get('wishlist');
  const wishlist: WishlistItem[] = kvValue ? JSON.parse(kvValue) : [];

  const newId = wishlist.length > 0 ? Math.max(...wishlist.map((i) => i.id)) + 1 : 1;

  const newItem: WishlistItem = {
    id: newId,
    ...newItemData,
    score: calculateScore(newItemData),
  };

  wishlist.push(newItem);
  await c.env.WISH_LIST_KV.put('wishlist', JSON.stringify(wishlist));

  return c.json(newItem);
});

export default app;
