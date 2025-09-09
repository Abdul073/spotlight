import InitialLayout from "@/components/InitialLayout";
import ClerkAndConvecProvider from "@/providers/ClerkAndConvecProvider";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missinf publishable key.");
}

export default function RootLayout() {
  return (
    <ClerkAndConvecProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
          <InitialLayout />
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkAndConvecProvider>
  );
}
