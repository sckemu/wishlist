import { useEffect, useState } from "react";
import "./App.css";

type WishlistItem = {
  id: number;
  item: string;
  category: "necessity" | "improvement";
  desireLevel: 1 | 2 | 3;
  status: "wanted" | "purchased" | "maybe_unnecessary" | "unnecessary";
  reason: string;
  memo: string;
  score: number;
};

function App() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [item, setItem] = useState("");
  const [category, setCategory] = useState<"necessity" | "improvement">("necessity");
  const [desireLevel, setDesireLevel] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState("");
  const [memo, setMemo] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemData, setEditingItemData] = useState<Partial<WishlistItem>>({});

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch("https://hono-backend.scmu.workers.dev/api/wishlist");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setWishlist(data);
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      }
    };
    fetchWishlist();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const newItemData = {
      item,
      category,
      desireLevel,
      status: "wanted", // Default status
      reason,
      memo,
    };

    try {
      const response = await fetch("https://hono-backend.scmu.workers.dev/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItemData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addedItem = await response.json();
      setWishlist([...wishlist, addedItem]);

      // Reset form fields
      setItem("");
      setCategory("necessity");
      setDesireLevel(1);
      setReason("");
      setMemo("");
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleEditClick = (item: WishlistItem) => {
    setEditingItemId(item.id);
    setEditingItemData({ ...item });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingItemData((prev) => ({
      ...prev,
      [name]: name === "desireLevel" ? Number(value) : value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItemId === null) return;

    try {
      const response = await fetch(`https://hono-backend.scmu.workers.dev/api/wishlist/${editingItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingItemData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedItem = await response.json();
      setWishlist(wishlist.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      setEditingItemId(null);
      setEditingItemData({});
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItemData({});
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`https://hono-backend.scmu.workers.dev/api/wishlist/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setWishlist(wishlist.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  return (
    <div className="container">
      <h1>欲しいものリスト</h1>
      <form onSubmit={handleSubmit} className="wishlist-form">
        <div className="form-group">
          <label>欲しいもの:</label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>カテゴリ:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "necessity" | "improvement")}
          >
            <option value="necessity">必需品</option>
            <option value="improvement">生活向上</option>
          </select>
        </div>
        <div className="form-group">
          <label>欲しい度:</label>
          <select
            value={desireLevel}
            onChange={(e) => setDesireLevel(Number(e.target.value) as 1 | 2 | 3)}
          >
            <option value={1}>★☆☆</option>
            <option value={2}>★★☆</option>
            <option value={3}>★★★</option>
          </select>
        </div>
        <div className="form-group">
          <label>必要な理由:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>メモ:</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
        <button type="submit">追加</button>
      </form>

      <div className="wishlist-display">
        <h2>リスト一覧</h2>
        <table>
          <thead>
            <tr>
              <th>欲しいもの</th>
              <th>カテゴリ</th>
              <th>欲しい度</th>
              <th>状態</th>
              <th>スコア</th>
              <th>理由</th>
              <th>メモ</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {wishlist.map((wish) => (
              <tr key={wish.id}>
                {editingItemId === wish.id ? (
                  <td colSpan={8}>
                    <form onSubmit={handleUpdate} className="edit-form">
                      <div className="form-group">
                        <label>欲しいもの:</label>
                        <input
                          type="text"
                          name="item"
                          value={editingItemData.item || ""}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>カテゴリ:</label>
                        <select
                          name="category"
                          value={editingItemData.category || "necessity"}
                          onChange={handleEditChange}
                        >
                          <option value="necessity">必需品</option>
                          <option value="improvement">生活向上</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>欲しい度:</label>
                        <select
                          name="desireLevel"
                          value={editingItemData.desireLevel || 1}
                          onChange={handleEditChange}
                        >
                          <option value={1}>★☆☆</option>
                          <option value={2}>★★☆</option>
                          <option value={3}>★★★</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>状態:</label>
                        <select
                          name="status"
                          value={editingItemData.status || "wanted"}
                          onChange={handleEditChange}
                        >
                          <option value="wanted">欲しい！</option>
                          <option value="purchased">購入完了</option>
                          <option value="maybe_unnecessary">いらないかも</option>
                          <option value="unnecessary">いらない</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>必要な理由:</label>
                        <textarea
                          name="reason"
                          value={editingItemData.reason || ""}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>メモ:</label>
                        <textarea
                          name="memo"
                          value={editingItemData.memo || ""}
                          onChange={handleEditChange}
                        />
                      </div>
                      <button type="submit">更新</button>
                      <button type="button" onClick={handleCancelEdit}>キャンセル</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td>{wish.item}</td>
                    <td>{wish.category === "necessity" ? "必需品" : "生活向上"}</td>
                    <td>{'★'.repeat(wish.desireLevel)}{'☆'.repeat(3 - wish.desireLevel)}</td>
                    <td>
                      {wish.status === "wanted" && "欲しい！"}
                      {wish.status === "purchased" && "購入完了"}
                      {wish.status === "maybe_unnecessary" && "いらないかも"}
                      {wish.status === "unnecessary" && "いらない"}
                    </td>
                    <td>{wish.score}</td>
                    <td>{wish.reason}</td>
                    <td>{wish.memo}</td>
                    <td>
                      <button onClick={() => handleEditClick(wish)}>編集</button>
                      <button onClick={() => handleDelete(wish.id)}>削除</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;