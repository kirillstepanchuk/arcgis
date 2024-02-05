import React from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {Map} from "./shared/components/Map";
import './App.css';


const queryClient = new QueryClient()

function App() {
  return (
      <QueryClientProvider client={queryClient}>
        <Map />
      </QueryClientProvider>
  );
}

export default App;
