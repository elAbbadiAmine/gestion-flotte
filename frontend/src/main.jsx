import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import App from './App.jsx'
import keycloak from './keycloak.js'
import { notifyNetworkError } from './network.js'
import './index.css'

keycloak.init({ onLoad: 'login-required', pkceMethod: 'S256', checkLoginIframe: false }).then(() => {
  const httpLink = createHttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql' })

  const authLink = setContext(async (_, { headers }) => {
    try { await keycloak.updateToken(30) } catch { keycloak.login() }
    return {
      headers: { ...headers, authorization: keycloak.token ? `Bearer ${keycloak.token}` : '' },
    }
  })

  const errorLink = onError(({ networkError }) => {
    if (networkError) notifyNetworkError()
  })

  const client = new ApolloClient({
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache(),
  })

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </StrictMode>,
  )
})
