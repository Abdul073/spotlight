import { Loader } from "@/components/Loader";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  let idParam: Id<"users"> | undefined = undefined;
  if (typeof id === "string" && id.length > 0 && id !== "undefined") {
    idParam = id as Id<"users">;
  }

  const profile = useQuery(
    api.users.getUserProfile,
    idParam ? { id: idParam } : "skip"
  );
  const posts = useQuery(
    api.posts.getPostsByUser,
    idParam ? { userId: idParam } : "skip"
  );
  const isFollowing = useQuery(
    api.users.isFollowing,
    idParam ? { followingId: idParam } : "skip"
  );

  const toggleFollow = useMutation(api.users.toggleFollow);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  if (
    !idParam ||
    profile === undefined ||
    posts === undefined ||
    isFollowing === undefined
  )
    return <Loader />;

  const profileData = profile as NonNullable<typeof profile>;
  const postsList = posts as NonNullable<typeof posts>;
  const isFollowingVal = isFollowing as NonNullable<typeof isFollowing>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profileData.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarAndStats}>
            {/* AVATAR */}
            <Image
              source={profileData.image}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />

            {/* STATS */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          <Text style={styles.name}>{profileData.fullname}</Text>
          {profileData.bio && <Text style={styles.bio}>{profileData.bio}</Text>}

          <Pressable
            style={[
              styles.followButton,
              isFollowingVal && styles.followingButton,
            ]}
            onPress={() => toggleFollow({ followingId: idParam })}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowingVal && styles.followingButtonText,
              ]}
            >
              {isFollowingVal ? "Following" : "Follow"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.postsGrid}>
          {postsList.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <Ionicons name="images-outline" size={48} color={COLORS.grey} />
              <Text style={styles.noPostsText}>No posts yet</Text>
            </View>
          ) : (
            <FlatList
              data={postsList}
              numColumns={3}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.gridItem}>
                  <Image
                    source={item.imageUrl}
                    style={styles.gridImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
