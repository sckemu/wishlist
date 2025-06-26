import { Hono } from 'hono';

type Bindings = {
	WISH_LIST_KV: KVNamespace;
};

type WishItem = {
	id: string;
	name: string;
	category: 'necessity' | 'nice_to_have';
	desireLevel: 1 | 2 | 3;
	status: 'wanted' | 'purchased' | 'maybe_not_needed' | 'not_needed';
	reason: string;
	memo: string;
	score: number;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => c.text('Hello Hono!'));

app.get('/items', async (c) => {
	const items = await c.env.WISH_LIST_KV.list();
	return c.json(items);
});

app.post('/items', async (c) => {
	const item = await c.req.json<Omit<WishItem, 'id' | 'score'>
	const id = crypto.randomUUID();

	const categoryCoefficient = item.category === 'necessity' ? 1.5 : 1.0;
	const desireCoefficient = item.desireLevel;
	const statusCoefficient = {
		wanted: 1.0,
		maybe_not_needed: 0.1,
		purchased: 0,
		not_needed: 0,
	}[item.status];

	const score = categoryCoefficient * desireCoefficient * statusCoefficient;

	const newItem: WishItem = { ...item, id, score };

	await c.env.WISH_LIST_KV.put(id, JSON.stringify(newItem));

	return c.json(newItem);
});

export default app;
