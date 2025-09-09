#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves the /app, /components, /hooks, /scripts, and /constants directories to /app-example based on user input and creates a new /app directory with an index.tsx and _layout.tsx file.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const root = process.cwd();
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];
const exampleDir = "app-example";
const newAppDir = "app";
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function ensureDirectory(directoryPath) {
  await fs.promises.mkdir(directoryPath, { recursive: true });
}

async function safeMoveDirectory(sourcePath, destinationPath) {
  try {
    await ensureDirectory(path.dirname(destinationPath));
    await fs.promises.rename(sourcePath, destinationPath);
    return { method: "rename" };
  } catch (error) {
    // On Windows, EPERM/EBUSY can occur when files are in use. EXDEV when crossing devices.
    if (["EPERM", "EBUSY", "EXDEV"].includes(error.code)) {
      await ensureDirectory(path.dirname(destinationPath));
      // Fallback: copy then remove
      await fs.promises.cp(sourcePath, destinationPath, { recursive: true });
      await fs.promises.rm(sourcePath, { recursive: true, force: true });
      return { method: "copy+remove" };
    }
    throw error;
  }
}

const moveDirectories = async (userInput) => {
  try {
    if (userInput === "y") {
      // Create the app-example directory
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    // Move old directories to new app-example directory or delete them
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        // Avoid moving/deleting the running scripts directory to prevent EPERM on Windows
        if (dir === "scripts") {
          console.log(
            "⚠️ Skipping /scripts while this reset script is running. Remove or move it manually after reset if desired."
          );
          continue;
        }

        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir);
          try {
            const result = await safeMoveDirectory(oldDirPath, newDirPath);
            console.log(
              `➡️ /${dir} moved to /${exampleDir}/${dir} (${result.method}).`
            );
          } catch (err) {
            console.log(
              `❌ Failed to move /${dir}: ${err.message}. You can move it manually to /${exampleDir}/${dir}.`
            );
          }
        } else {
          try {
            await fs.promises.rm(oldDirPath, { recursive: true, force: true });
            console.log(`❌ /${dir} deleted.`);
          } catch (err) {
            console.log(
              `❌ Failed to delete /${dir}: ${err.message}. You can delete it manually.`
            );
          }
        }
      } else {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    // Create new /app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 New /app directory created.");

    // Create index.tsx
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 app/index.tsx created.");

    // Create _layout.tsx
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 app/_layout.tsx created.");

    console.log("\n✅ Project reset complete. Next steps:");
    console.log(
      `1. Run \`npx expo start\` to start a development server.\n2. Edit app/index.tsx to edit the main screen.${
        userInput === "y"
          ? `\n3. Delete the /${exampleDir} directory when you're done referencing it.`
          : ""
      }`
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${error.message}`);
  }
};

rl.question(
  "Do you want to move existing files to /app-example instead of deleting them? (Y/n): ",
  (answer) => {
    const userInput = answer.trim().toLowerCase() || "y";
    if (userInput === "y" || userInput === "n") {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
      rl.close();
    }
  }
);
