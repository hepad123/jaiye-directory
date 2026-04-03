async function load() {
  setLoading(true)

  const { data: profileData } = await supabase
    .from('profiles').select('*').eq('username', username).maybeSingle()
  if (!profileData) { setNotFound(true); setLoading(false); return }
  setProfile(profileData)

  const profileId = profileData.id

  // Fire all queries in parallel
  const [usedRows, recRows, followerRows, followingRows, myFollowingRows] = await Promise.all([
    supabase.from('reviews').select('vendor_id').eq('user_id', profileId).eq('comment', '__used__'),
    supabase.from('vendor_recommendations').select('vendor_id').eq('user_id', profileId),
    supabase.from('follows').select('follower_id').eq('following_id', profileId),
    supabase.from('follows').select('following_id').eq('follower_id', profileId),
    user?.id ? supabase.from('follows').select('following_id').eq('follower_id', user.id) : Promise.resolve({ data: [] }),
  ])

  // Used vendors
  const usedIds = [...new Set((usedRows.data ?? []).map(r => r.vendor_id))]
  const recIds  = [...new Set((recRows.data  ?? []).map(r => r.vendor_id))]

  const followerIds  = (followerRows.data  ?? []).map(r => r.follower_id)
  const followingIds = (followingRows.data ?? []).map(r => r.following_id)

  // Fetch vendor + profile data in parallel
  const [usedVendorRes, recVendorRes, followerProfileRes, followingProfileRes] = await Promise.all([
    usedIds.length    ? supabase.from('vendors').select('id, name, category, location, instagram, price_from').in('id', usedIds)    : Promise.resolve({ data: [] }),
    recIds.length     ? supabase.from('vendors').select('id, name, category, location, instagram, price_from').in('id', recIds)     : Promise.resolve({ data: [] }),
    followerIds.length  ? supabase.from('profiles').select('id, display_name, username').in('id', followerIds)  : Promise.resolve({ data: [] }),
    followingIds.length ? supabase.from('profiles').select('id, display_name, username').in('id', followingIds) : Promise.resolve({ data: [] }),
  ])

  if (usedVendorRes.data)    setUsedVendors(usedVendorRes.data)
  if (recVendorRes.data)     setRecVendors(recVendorRes.data)
  if (followerProfileRes.data)  setFollowers(followerProfileRes.data)
  if (followingProfileRes.data) setFollowing(followingProfileRes.data)
  if (myFollowingRows.data)  setFollowingIds(new Set(myFollowingRows.data.map(r => r.following_id)))

  setLoading(false)
}
