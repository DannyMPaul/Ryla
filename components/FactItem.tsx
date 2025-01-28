// // import React from 'react';
// // import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
// // import { Fact } from '../types';

// // interface FactItemProps {
// //   fact: Fact;
// //   onPress: () => void;
// // }

// // const FactItem: React.FC<FactItemProps> = ({ fact, onPress }) => {
// //   return (
// //     <TouchableOpacity onPress={onPress} style={styles.container}>
// //       <Image source={{ uri: fact.image }} style={styles.image} />
// //       <View style={styles.textContainer}>
// //         <Text style={styles.text}>{fact.text}</Text>
// //       </View>
// //     </TouchableOpacity>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flexDirection: 'row',
// //     padding: 10,
// //     backgroundColor: '#fff',
// //     borderRadius: 10,
// //     marginBottom: 10,
// //     elevation: 3,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 2,
// //   },
// //   image: {
// //     width: 80,
// //     height: 80,
// //     borderRadius: 10,
// //   },
// //   textContainer: {
// //     flex: 1,
// //     marginLeft: 10,
// //     justifyContent: 'center',
// //   },
// //   text: {
// //     fontSize: 16,
// //   },
// // });

// // export default FactItem;

// import React from 'react';
// import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
// import { Fact } from '../types';
// import { ImageFiles } from '../constants/ImageFiles';

// interface FactItemProps {
//   fact: Fact;
//   onPress: () => void;
// }

// const FactItem: React.FC<FactItemProps> = ({ fact, onPress }) => {
//   return (
//     <TouchableOpacity onPress={onPress} style={styles.container}>
//       <Image source={ImageFiles[fact.image as keyof typeof ImageFiles]} style={styles.image} />
//       <View style={styles.textContainer}>
//         <Text style={styles.text}>{fact.text}</Text>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     padding: 10,
//     backgroundColor: 'rgba(0, 0, 0, 0.83)',
//     borderRadius: 50,
//     marginBottom: 10,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   image: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//   },
//   textContainer: {
//     flex: 1,
//     marginLeft: 10,
//     marginRight:5,
//     justifyContent: 'center',
//   },
//   text: {
//     fontSize: 17,
//     color:'rgb(255, 255, 255)',
//   },
// });

// export default FactItem;

import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Fact } from '../types/index';
import { ImageFiles } from '../constants/ImageFiles';

interface FactItemProps {
  fact: Fact;
  onPress: () => void;
}


const FactItem = forwardRef<React.ElementRef<typeof TouchableOpacity>, FactItemProps>(
  ({ fact, onPress }, ref) => {
    return (
      <TouchableOpacity ref={ref} onPress={onPress} style={styles.container}>
        <Image source={ImageFiles[fact.image as keyof typeof ImageFiles]} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={styles.text}>{fact.text}</Text>
        </View>
      </TouchableOpacity>
    );
  }
);


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.83)',
    borderRadius: 50,
    marginBottom: 10,
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 5,
    justifyContent: 'center',
  },
  text: {
    fontSize: 17,
    color: 'rgb(255, 255, 255)',
  },
});

export default FactItem;

