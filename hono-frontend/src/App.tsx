import { useEffect, useState } from "react";
import "./App.css";

type WishlistItem = {
  id: number;
  item: string;
  price: number;
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
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<"necessity" | "improvement">("necessity");
  const [desireLevel, setDesireLevel] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState("");
  const [memo, setMemo] = useState("");
  const [editingCell, setEditingCell] = useState<{ id: number | null; field: string | null }>({ id: null, field: null });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch("https://hono-backend.scmu.workers.dev/api/wishlist", { credentials: 'include' });
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

  const handleSaveNewItem = async () => {
    if (!item) return;

    const newItemData = {
      item,
      price,
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
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addedItem = await response.json();
      setWishlist([...wishlist, addedItem]);

      // Reset form fields
      setItem("");
      setPrice(0);
      setCategory("necessity");
      setDesireLevel(1);
      setReason("");
      setMemo("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleUpdate = async (id: number, field: string, value: any) => {
    const itemToUpdate = wishlist.find((item) => item.id === id);
    if (!itemToUpdate) return;

    const updatedItemData = { ...itemToUpdate, [field]: value };

    try {
      const response = await fetch(`https://hono-backend.scmu.workers.dev/api/wishlist/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedItemData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedItem = await response.json();
      setWishlist(wishlist.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      setEditingCell({ id: null, field: null }); // Exit editing mode
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`https://hono-backend.scmu.workers.dev/api/wishlist/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setWishlist(wishlist.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleInputChange = (id: number, field: string, value: any) => {
    setWishlist(
      wishlist.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const renderEditableCell = (item: WishlistItem, field: keyof WishlistItem, displayValue: string | JSX.Element, className: string = "") => {
    const isEditing = editingCell.id === item.id && editingCell.field === field;

    if (isEditing) {
      switch (field) {
        case "item":
        case "reason":
        case "memo":
          return (
            <input
              type="text"
              value={item[field] as string}
              onChange={(e) => handleInputChange(item.id, field, e.target.value)}
              onBlur={(e) => handleUpdate(item.id, field, e.target.value)}
              autoFocus
            />
          );
        case "price":
          return (
            <input
              type="number"
              value={(item[field] as number) || 0}
              onChange={(e) => handleInputChange(item.id, field, Number(e.target.value))}
              onBlur={(e) => handleUpdate(item.id, field, Number(e.target.value))}
              autoFocus
            />
          );
        case "category":
          return (
            <div className="inline-selector">
              <button onClick={() => handleUpdate(item.id, field, "necessity")}>必需品</button>
              <button onClick={() => handleUpdate(item.id, field, "improvement")}>生活向上</button>
            </div>
          );
        case "desireLevel":
          return (
            <div className="inline-selector">
              <button onClick={() => handleUpdate(item.id, field, 1)}>★☆☆</button>
              <button onClick={() => handleUpdate(item.id, field, 2)}>★★☆</button>
              <button onClick={() => handleUpdate(item.id, field, 3)}>★★★</button>
            </div>
          );
        case "status":
          return (
            <div className="inline-selector">
              <button onClick={() => handleUpdate(item.id, field, "wanted")}>欲しい！</button>
              <button onClick={() => handleUpdate(item.id, field, "purchased")}>購入完了</button>
              <button onClick={() => handleUpdate(item.id, field, "maybe_unnecessary")}>いらないかも</button>
              <button onClick={() => handleUpdate(item.id, field, "unnecessary")}>いらない</button>
            </div>
          );
        default:
          return <span className={className}>{displayValue}</span>;
      }
    } else {
      return <span className={className} onClick={() => setEditingCell({ id: item.id, field: field })}>{displayValue}</span>;
    }
  };

  return (
    <div className="container">
      <h1>欲しいものリスト</h1>

      <div className="wishlist-display">
        <h2>リスト一覧</h2>
        <table>
          <thead>
            <tr>
              <th>欲しいもの</th>
              <th>価格</th>
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
            {wishlist.slice().sort((a, b) => b.score - a.score).map((wish) => (
              <tr key={wish.id}>
                <td>{renderEditableCell(wish, "item", wish.item)}</td>
                <td>{renderEditableCell(wish, "price", `¥${(wish.price || 0).toLocaleString()}`)}</td>
                <td>
                  {renderEditableCell(wish, "category", wish.category === "necessity" ? "必需品" : "生活向上", `category-${wish.category}`)}
                </td>
                <td>
                  {renderEditableCell(wish, "desireLevel", '★'.repeat(wish.desireLevel) + '☆'.repeat(3 - wish.desireLevel), `desire-level-${wish.desireLevel}`)}
                </td>
                <td>
                  {renderEditableCell(wish, "status",
                    wish.status === "wanted" ? "欲しい！" :
                    wish.status === "purchased" ? "購入完了" :
                    wish.status === "maybe_unnecessary" ? "いらないかも" :
                    "いらない",
                    `status-${wish.status}`
                  )}
                </td>
                <td>{wish.score}</td>
                <td>{renderEditableCell(wish, "reason", wish.reason)}</td>
                <td>{renderEditableCell(wish, "memo", wish.memo)}</td>
                <td>
                  <button onClick={() => handleDelete(wish.id)} className="delete-button">削除</button>
                </td>
              </tr>
            ))}
            {isAdding ? (
              <tr>
                <td><input type="text" value={item} onChange={(e) => setItem(e.target.value)} placeholder="欲しいもの" required /></td>
                <td><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="価格" /></td>
                <td>
                  <select value={category} onChange={(e) => setCategory(e.target.value as "necessity" | "improvement")}>
                    <option value="necessity">必需品</option>
                    <option value="improvement">生活向上</option>
                  </select>
                </td>
                <td>
                  <select value={desireLevel} onChange={(e) => setDesireLevel(Number(e.target.value) as 1 | 2 | 3)}>
                    <option value={1}>★☆☆</option>
                    <option value={2}>★★☆</option>
                    <option value={3}>★★★</option>
                  </select>
                </td>
                <td>-</td>
                <td>-</td>
                <td><textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="理由" /></td>
                <td><textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="メモ" /></td>
                <td>
                  <button onClick={handleSaveNewItem}>保存</button>
                  <button onClick={() => setIsAdding(false)}>キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: "center" }}>
                  <button onClick={() => setIsAdding(true)} className="add-button">+ 追加</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;