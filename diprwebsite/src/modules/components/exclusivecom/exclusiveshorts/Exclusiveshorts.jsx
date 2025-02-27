import React, { useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import { FaPlay, FaRegComment, FaHeart } from "react-icons/fa";
import { AiOutlineLike } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import {
  Container,
  Content,
  VideoCard1,
  VideoThumbnail,
  VideoDetails,
  NewsMeta,
  Title,
  CommentContainer,
  CommentInput,
  CommentButton,
  InteractionContainer,
  CommentSection,
  LikeCount,
  Comment,
  ProfileImage,
  CommentContent,
  UserHeader,
  UserInfo,
  Username,
  Time,
  CommentText,
  Actions,
  ActionIcon,
} from "../exclusiveshorts/Exclusiveshorts.styles";
import { getVideos, ShortlikeVideo, ShortVideoaddComment } from "../../../../services/videoApi/videoApi";
import { FontSizeContext } from "../../../../context/FontSizeProvider";

const Exclusiveshorts = () => {
  const [videosData, setVideosData] = useState([]);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [likedVideos, setLikedVideos] = useState(new Set());
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [userId, setUserId] = useState(null);
  const [likeCounts, setLikeCounts] = useState({});
  const [error, setError] = useState("");
  const [openCommentSection, setOpenCommentSection] = useState(null);
  const { fontSize } = useContext(FontSizeContext);

  const [debouncingLike, setDebouncingLike] = useState(false);


  // Fetch userId from cookies
  useEffect(() => {
    const storedUserId = Cookies.get("userId");
    setUserId(storedUserId);
  }, []);

  // Fetch video data
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await getVideos();
        if (response.success && Array.isArray(response.data)) {
          setVideosData(response.data);

          // Initialize like counts with the data from API response
          const initialLikeCounts = {};
          response.data.forEach((video) => {
            initialLikeCounts[video._id] = Math.max(video.total_Likes || 0, 0); // Ensure no negative like counts
          });
          setLikeCounts(initialLikeCounts);

          const initialComments = {};
          response.data.forEach((video) => {
            if (video.Comments && Array.isArray(video.Comments)) {
              initialComments[video._id] = video.Comments;
            }
          });
          setComments(initialComments);
        } else {
          setVideosData([]);
        }
      } catch (error) {
        setVideosData([]);
      }
    };

    fetchVideos();
  }, []);

  // Handle video play
  const handlePlayClick = (videoId) => {
    setPlayingVideoId(videoId);
  };
  //&&&&&&&&&&&&&& old code start 
  // Handle like button click
  // const handleLikeClick = async (videoId) => {
  //   if (!userId) {
  //     setError("User is not logged in.");
  //     return;
  //   }

  //   try {
  //     const isLiked = likedVideos.has(videoId);
  //     const likeData = { videoId: videoId, userId };

  //     // Send like request
  //     await ShortlikeVideo(likeData);

  //     const newLikedVideos = new Set(likedVideos);
  //     isLiked ? newLikedVideos.delete(videoId) : newLikedVideos.add(videoId);
  //     setLikedVideos(newLikedVideos);

  //     // Update like count ensuring it doesn't go below 0
  //     setLikeCounts((prevCounts) => ({
  //       ...prevCounts,
  //       [videoId]: isLiked ? Math.max(prevCounts[videoId] - 1, 0) : prevCounts[videoId] + 1,
  //     }));
  //   } catch (error) {
  //     setError("Failed to like the video. Please try again.");
  //   }
  // };
  //&&&&&&&&&&&&&& old code end
  //&&&&&&&&&&&&&& new code start 
  const handleLikeClick = async (videoId) => {
    if (!userId) {
      setError("User is not logged in.");
      return;
    }
  
    if (debouncingLike) return; // Prevent further clicks during debounce
  
    setDebouncingLike(true); // Start debouncing
  
    setTimeout(async () => {
      try {
        const isLiked = likedVideos.has(videoId);
        const likeData = { videoId: videoId, userId };
  
        // Send like request
        await ShortlikeVideo(likeData);
  
        const newLikedVideos = new Set(likedVideos);
        isLiked ? newLikedVideos.delete(videoId) : newLikedVideos.add(videoId);
        setLikedVideos(newLikedVideos);
  
        // Update like count ensuring it doesn't go below 0
        setLikeCounts((prevCounts) => ({
          ...prevCounts,
          [videoId]: isLiked ? Math.max(prevCounts[videoId] - 1, 0) : prevCounts[videoId] + 1,
        }));
      } catch (error) {
        setError("Failed to like the video. Please try again.");
      } finally {
        setDebouncingLike(false); // Reset debouncing state after the action is done
      }
    }, 500); // 500ms debounce
  };
//&&&&&&&&&&&&&& new code end
  // Handle comment input change
  const handleCommentChange = (e, videoId) => {
    setNewComments((prev) => ({
      ...prev,
      [videoId]: e.target.value,
    }));
  };

  // Handle adding a comment
  const handleAddComment = async (videoId) => {
    const commentText = newComments[videoId]?.trim();
    if (!commentText) {
      setError("Please enter a comment.");
      return;
    }

    if (!userId) {
      setError("User is not logged in.");
      return;
    }

    const commentData = { text: commentText, videoId, userId };

    try {
      const response = await ShortVideoaddComment(commentData);
      setComments((prevComments) => ({
        ...prevComments,
        [videoId]: [...(prevComments[videoId] || []), response.comment],
      }));

      setNewComments((prev) => ({
        ...prev,
        [videoId]: "",
      }));
      setError("");
      window.location.reload();
    } catch (err) {
      setError("Failed to add comment. Please try again.");
    }
  };

  // Toggle comment section visibility
  const toggleCommentSection = (videoId) => {
    setOpenCommentSection((prev) => (prev === videoId ? null : videoId));
  };

  // Handle like for a comment
  const handleLikeComment = async (commentId, videoId) => {
    setComments((prevComments) => ({
      ...prevComments,
      [videoId]: prevComments[videoId].map((comment) =>
        comment._id === commentId
          ? { ...comment, likes: (comment.likes || 0) + 1 }
          : comment
      ),
    }));
  };

  return (
    <Container>
      <Content>
        {videosData.map((video) => (
          <React.Fragment key={video._id}>
            <VideoCard1>
              <VideoThumbnail onClick={() => handlePlayClick(video._id)}>
                {playingVideoId === video._id ? (
                  <video id={video._id} controls autoPlay loop width="100%" height="200px" style={{ objectFit: "cover" }}>
                    <source src={video.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <>
                    <img src={video.thumbnail} alt={video.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                    <FaPlay size={40} color="#fff" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
                  </>
                )}
              </VideoThumbnail>
              <VideoDetails>
                <NewsMeta>
                  <span style={fontSize !== 100 ? { fontSize: `${fontSize}%` } : undefined}>{new Date(video.createdAt).toLocaleDateString()}</span>
                </NewsMeta>
                <Title style={fontSize !== 100 ? { fontSize: `${fontSize}%` } : undefined}>{video.title}</Title>
              </VideoDetails>
            </VideoCard1>

            <CommentSection>
              <InteractionContainer>
                <CommentContainer>
                  <AiOutlineLike
                    style={{ fontSize: fontSize !== 100 ? `${fontSize}%` : undefined, cursor: "pointer" }}
                    size={30}
                    color={likedVideos.has(video._id) ? "blue" : "#000"}
                    onClick={() => handleLikeClick(video._id)}
                  />
                  <LikeCount style={fontSize !== 100 ? { fontSize: `${fontSize}%` } : undefined}>
                    {likeCounts[video._id] || 0}
                  </LikeCount>
                  <FaRegComment
                    style={{ fontSize: fontSize !== 100 ? `${fontSize}%` : undefined, cursor: "pointer" }}
                    size={25}
                    onClick={() => toggleCommentSection(video._id)}
                  />
                  <CommentInput
                    style={fontSize !== 100 ? { fontSize: `${fontSize}%` } : undefined}
                    type="text"
                    value={newComments[video._id] || ""}
                    onChange={(e) => handleCommentChange(e, video._id)}
                    placeholder="Add a comment..."
                  />
                  <CommentButton style={fontSize !== 100 ? { fontSize: `${fontSize}%` } : undefined} onClick={() => handleAddComment(video._id)}>
                    Add Comment
                  </CommentButton>
                </CommentContainer>
              </InteractionContainer>

              <AnimatePresence>
                {openCommentSection === video._id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    {comments[video._id]?.length === 0 ? (
                      <p>No comments yet.</p>
                    ) : (
                      comments[video._id]?.map((comment) => (
                        <Comment key={comment._id}>
                          <ProfileImage src={comment.user?.profileImage || "https://via.placeholder.com/50"} alt={comment.user?.displayName || "Anonymous"} />
                          <CommentContent>
                            <UserHeader>
                              <UserInfo style={fontSize !== 100 ? { fontSize: `${fontSize}%` } : undefined}>
                                <Username>{comment.user?.displayName || "Anonymous"}</Username>
                              </UserInfo>
                              <Time style={fontSize !== 100 ? { fontSize: `${fontSize}%` } : undefined}>{new Date(comment.createdTime).toLocaleTimeString()}</Time>
                            </UserHeader>
                            <CommentText style={fontSize !== 100 ? { fontSize: `${fontSize}%` } : undefined}>{comment.comment}</CommentText>
                            <Actions>
                              <ActionIcon onClick={() => handleLikeComment(comment._id, video._id)}>
                                <FaHeart /> {comment.likes || 0}
                              </ActionIcon>
                            </Actions>
                          </CommentContent>
                        </Comment>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CommentSection>
          </React.Fragment>
        ))}
      </Content>
    </Container>
  );
};

export default Exclusiveshorts;
