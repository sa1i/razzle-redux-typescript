import { Request, Response } from 'express';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnyAction, ReducersMapObject } from 'redux';

import createStore from '../core/createStore';
import renderToString from '../core/renderToString';
import DefaultDocument, { DocumentProps } from './Document';

export default function<State = any, Action extends AnyAction = any, DocumentExtraProps = undefined>({
  initialState,
  razzleAssets,
  rootReducer,
  routes,
  document,
  callback
}: {
  initialState: State;
  razzleAssets: any;
  rootReducer: ReducersMapObject<State, Action>;
  routes: any;
  document?: {
    Component: React.ComponentType<DocumentProps & DocumentExtraProps>;
    props: DocumentExtraProps;
  };
  callback: any;
}) {
  return async (req: Request, res: Response) => {
    const storeArg = {
      initialState,
      req,
      rootReducer,
      routes
    };

    const { found, store } = createStore<State, Action>(storeArg);

    if (callback) {
      await callback(store);
    }

    try {
      const { html } = await renderToString({ found, store });
      const documentProps = {
        assets: razzleAssets,
        html,
        initialState: store.getState()
      };

      const component = document ? (
        <document.Component {...{ ...document.props, ...documentProps }} />
      ) : (
        <DefaultDocument {...documentProps} />
      );
      const staticMarkup = renderToStaticMarkup(component);

      res.send(staticMarkup);
    } catch (error) {
      console.error(error);

      res.status(500).send(error.message);
    }
  };
}
