declare module 'react-native-flags' {
  import { ComponentType } from 'react';
  
  interface FlagProps {
    code: string;
    size: number;
    type?: string;
  }

  const Flag: ComponentType<FlagProps>;
  export default Flag;
} 