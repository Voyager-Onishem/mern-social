import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";

const API_URL = process.env.REACT_APP_API_URL;

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);

  const getPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = []; }
      if (!response.ok) {
        console.warn('Failed to load feed posts:', data);
        dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
        return;
      }
      dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.warn('Error fetching feed posts:', e);
      dispatch(setPosts({ posts: [] }));
    }
  };

  const getUserPosts = async () => {
    try {
      const response = await fetch(
        `${API_URL}/posts/${userId}/posts`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = []; }
      if (!response.ok) {
        console.warn('Failed to load user posts:', data);
        dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
        return;
      }
      dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.warn('Error fetching user posts:', e);
      dispatch(setPosts({ posts: [] }));
    }
  };

  useEffect(() => {
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {posts.map(
        ({
          _id,
          userId,
          firstName,
          lastName,
          description,
          location,
          picturePath,
          audioPath,
          userPicturePath,
          likes,
          comments,
          createdAt,
        }) => (
          <PostWidget
            key={_id}
            postId={_id}
            postUserId={userId}
            name={`${firstName} ${lastName}`}
            description={description}
            location={location}
            picturePath={picturePath}
            audioPath={audioPath}
            userPicturePath={userPicturePath}
            likes={likes}
            comments={comments}
            createdAt={createdAt}
          />
        )
      )}
    </>
  );
};

export default PostsWidget;
