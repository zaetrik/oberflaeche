import { Component } from "oberflaeche";
import Basket from "../Basket";
import ShopItem from "../ShopItem";

export type ShopItemT = { name: string; price: number; id: string };
const shopItems: ShopItemT[] = [
  { name: "Water", price: 0.99, id: "1" },
  { name: "Banana", price: 1.49, id: "2" },
  { name: "Apple", price: 0.89, id: "3" },
  { name: "Orange Juice", price: 1.89, id: "4" },
  { name: "Chocolate", price: 2.59, id: "5" },
];

const oberflaecheId = "shop";
const Shop: Component = ({}, ctx) => {
  const [basket, setBasket] = ctx.state<ShopItemT[]>(oberflaecheId, []);

  return (
    <div oberflaecheId={oberflaecheId}>
      <ul>
        {shopItems.map((item) => (
          <li>
            <ShopItem shopItem={item} oberflaecheId={`shop-item-${item.id}`} />
          </li>
        ))}
      </ul>
      <Basket />
    </div>
  );
};

export default Shop;
