import { OperationType, db, handleFirestoreError } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";

export interface Settings {
  name: string;
  logoUrl?: string;
  whatsappNumber: string;
  deliveryActive: boolean;
  deliveryFee: number;
  deliveryRadius: number;
  brandColor?: string;
  textColor?: string;
  textDimColor?: string;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  available: boolean;
}

export interface Table {
  id?: string;
  number: number;
  status: 'free' | 'occupied' | 'checking_out';
}

export interface Employee {
  id?: string;
  name: string;
  role: 'admin' | 'waiter' | 'chef' | 'delivery';
  email?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  type: 'table' | 'delivery';
  tableId?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: any;
  whatsappSent: boolean;
}

// Utility to compress/resize images for Base64 storage in Firestore (limits 1MB)
export const compressImage = (file: File, maxWidth = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use high compression to stay under Firestore limits
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

// Service Functions
export const syncCategories = (callback: (categories: any[]) => void) => {
  const q = query(collection(db, "categories"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(categories);
  }, (err) => handleFirestoreError(err, OperationType.LIST, "categories"));
};

export const syncSettings = (callback: (settings: Settings) => void) => {
  return onSnapshot(doc(db, "settings", "config"), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Settings);
    }
  }, (err) => handleFirestoreError(err, OperationType.GET, "settings/config"));
};

export const syncProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, "products"), orderBy("category"));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    callback(products);
  }, (err) => handleFirestoreError(err, OperationType.LIST, "products"));
};

export const syncOrders = (callback: (orders: Order[]) => void) => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    callback(orders);
  }, (err) => handleFirestoreError(err, OperationType.LIST, "orders"));
};

export const syncTables = (callback: (tables: Table[]) => void) => {
  const q = query(collection(db, "tables"), orderBy("number"));
  return onSnapshot(q, (snapshot) => {
    const tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
    callback(tables);
  }, (err) => handleFirestoreError(err, OperationType.LIST, "tables"));
};

export const syncEmployees = (callback: (employees: Employee[]) => void) => {
  const q = query(collection(db, "employees"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    callback(employees);
  }, (err) => handleFirestoreError(err, OperationType.LIST, "employees"));
};

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'whatsappSent'>) => {
  try {
    await addDoc(collection(db, "orders"), {
      ...order,
      createdAt: Timestamp.now(),
      whatsappSent: false
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "orders");
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status'], phone?: string, settings?: Settings) => {
  try {
    await updateDoc(doc(db, "orders", orderId), { status });
    
    if (status === 'ready' && phone && settings?.whatsappNumber) {
      // Notify via server API
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          phone,
          message: `Olá! Seu pedido #${orderId.slice(-4)} no ${settings.name} já está pronto!`
        })
      });
      await updateDoc(doc(db, "orders", orderId), { whatsappSent: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
  }
};

export const saveSettings = async (settings: Settings) => {
  try {
    await setDoc(doc(db, "settings", "config"), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "settings/config");
  }
};
