import { Component } from "oberflaeche";
import Shop, { ShopItemT } from "../Shop";

const Basket: Component = ({}, ctx) => {
  const [basket, updateBasket] = ctx.stateOther<ShopItemT[], {}>(Shop, {}, "shop");

  const remove = (index: number) => () => {
    updateBasket(basket().filter((_, i) => i !== index));
  };

  return (
    <div>
      <ul>
        {basket().map((item, i) => (
          <li class='basket-item'>
            <div>{item.name}</div>
            <button oberflaecheId={`basket-remove-${item.id}`} onClick={remove(i)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div>
        Total: $
        {basket()
          .reduce((sum, item) => sum + item.price, 0)
          .toFixed(2)}
      </div>
    </div>
  );
};
export default Basket;
