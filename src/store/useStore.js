import { create } from "zustand";

const useStore = create((set) => ({
	totalprice: 10,
	updatePrice: (value) =>
		set(() => ({
			totalprice: value,
		})),
	product: [],
	updateProduct: (value) =>
		set(() => ({
			product: value,
		})),
}));

export default useStore;
