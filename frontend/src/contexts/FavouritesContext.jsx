import React, { createContext, useContext, useState } from "react";

const FavouritesContext = createContext(undefined);

export const FavouritesProvider = ({ children }) => {
  const [favourites, setFavourites] = useState([]);

  const addToFavourites = (item) => {
    setFavourites((prev) => {
      if (prev.find((fav) => fav.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFromFavourites = (id) => {
    setFavourites((prev) => prev.filter((fav) => fav.id !== id));
  };

  const isFavourite = (id) => {
    return favourites.some((fav) => fav.id === id);
  };

  const getTotalFavourites = () => {
    return favourites.length;
  };

  return (
    <FavouritesContext.Provider
      value={{
        favourites,
        addToFavourites,
        removeFromFavourites,
        isFavourite,
        getTotalFavourites,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
};

export const useFavourites = () => {
  const context = useContext(FavouritesContext);
  if (!context) {
    throw new Error("useFavourites must be used within a FavouritesProvider");
  }
  return context;
};
