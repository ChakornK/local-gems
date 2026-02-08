import ProfileView from "@/components/ProfileView";

export default async function UserProfilePage({ params }) {
  const { id } = await params;

  return <ProfileView isMine={false} userId={id} />;
}
