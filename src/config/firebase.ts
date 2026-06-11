import app from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// En React Native Firebase, la inicialización nativa ocurre automáticamente
// en las plataformas Android e iOS a través de los archivos de configuración
// google-services.json y GoogleService-Info.plist cargados al compilar.
//
// Centralizamos y exportamos las instancias de los servicios de Firebase
// para asegurar consistencia y facilitar el mocking en pruebas.

export { auth, firestore, storage };
export default app;
