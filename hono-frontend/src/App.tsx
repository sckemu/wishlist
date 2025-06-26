import { useState, useEffect } from 'react';

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

function App() {
	const [items, setItems] = useState<WishItem[]>([]);

	useEffect(() => {
		const fetchItems = async () => {
			const res = await fetch('https://hono-backend.scmu.workers.dev/items');
			const data = await res.json();
			setItems(data.keys.map((key: any) => JSON.parse(key.metadata)));
		};
		fetchItems();
	}, []);

  return (
    <div className="container">
      <h1 className="my-4">欲しいものリスト</h1>
      <form className="mb-4" onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const newItem: Omit<WishItem, 'id' | 'score'> = {
          name: formData.get('name') as string,
          category: formData.get('category') as 'necessity' | 'nice_to_have',
          desireLevel: parseInt(formData.get('desireLevel') as string) as 1 | 2 | 3,
          status: formData.get('status') as 'wanted' | 'purchased' | 'maybe_not_needed' | 'not_needed',
          reason: formData.get('reason') as string,
          memo: formData.get('memo') as string,
        };

        const res = await fetch('https://hono-backend.scmu.workers.dev/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newItem),
        });
        const addedItem = await res.json();
        setItems([...items, addedItem]);
        form.reset();
      }}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">名前</label>
          <input type="text" className="form-control" id="name" name="name" required />
        </div>
        <div className="mb-3">
          <label htmlFor="category" className="form-label">カテゴリ</label>
          <select className="form-select" id="category" name="category" required>
            <option value="necessity">必需品</option>
            <option value="nice_to_have">生活向上</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="desireLevel" className="form-label">欲しい度</label>
          <select className="form-select" id="desireLevel" name="desireLevel" required>
            <option value="3">高</option>
            <option value="2">中</option>
            <option value="1">低</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="status" className="form-label">状態</label>
          <select className="form-select" id="status" name="status" required>
            <option value="wanted">欲しい！</option>
            <option value="purchased">購入完了</option>
            <option value="maybe_not_needed">いらないかも</option>
            <option value="not_needed">いらない</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="reason" className="form-label">必要な理由</label>
          <textarea className="form-control" id="reason" name="reason"></textarea>
        </div>
        <div className="mb-3">
          <label htmlFor="memo" className="form-label">メモ</label>
          <textarea className="form-control" id="memo" name="memo"></textarea>
        </div>
        <button type="submit" className="btn btn-primary">追加</button>
      </form>

      <h2>アイテム一覧</h2>
      <ul className="list-group">
        {items.sort((a, b) => b.score - a.score).map((item) => (
          <li key={item.id} className="list-group-item">
            <h5>{item.name} <span className="badge bg-secondary">スコア: {item.score.toFixed(2)}</span></h5>
            <p>カテゴリ: {item.category === 'necessity' ? '必需品' : '生活向上'}</p>
            <p>欲しい度: {item.desireLevel}</p>
            <p>状態: {item.status}</p>
            {item.reason && <p>必要な理由: {item.reason}</p>}
            {item.memo && <p>メモ: {item.memo}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
