import { Component, Props } from "oberflaeche";
import Shop, { ShopItemT } from "../Shop";

type ShopItemProps = { shopItem: ShopItemT; oberflaecheId: string };
const ShopItem: Component<ShopItemProps> = ({ shopItem, oberflaecheId }, ctx) => {
  const [basket, updateShop] = ctx.stateOther<ShopItemT[], Props>(Shop, {}, "shop");

  const addToBasket = () => {
    updateShop([...basket(), shopItem]);
  };

  return (
    <div class='shop-item'>
      <div>{shopItem.name}</div>
      <span>{shopItem.price} $</span>
      <button oberflaecheId={oberflaecheId} onClick={addToBasket}>
        Add to basket
      </button>
    </div>
  );
};

export default ShopItem;
