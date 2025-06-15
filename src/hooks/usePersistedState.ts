import { useEffect, useState } from "react";

export const usePersistedState = <T>(props: {
  key: string;
  initialState: T;
}) => {
  const isStringType = typeof props.initialState === "string";

  const getFromLocalStorage = () => {
    const value = localStorage.getItem(props.key);
    if (value === null) {
      return null;
    } else {
      if (isStringType) {
        return value as T;
      } else {
        try {
          return JSON.parse(value) as T;
        } catch (err) {
          console.log(err);
          return props.initialState;
        }
      }
    }
  };

  const [state, setState] = useState<T>(
    getFromLocalStorage() ?? props.initialState,
  );

  useEffect(() => {
    localStorage.setItem(
      props.key,
      isStringType ? (state as string) : JSON.stringify(state),
    );
  }, [isStringType, props.key, state]);

  return [state, setState] as const;
};
