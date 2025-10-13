import { Home, Grid, FileText, Layers, Briefcase } from "lucide-react"
import {HouseIcon} from "@/components/dashboard/home-icon";
import {BookOpenTextIcon} from "@/components/dashboard/portfolio-icon";

export const sidebarItems = [
  {
    title: "Home",
    value: "home",
    icon: <HouseIcon />,
    isActive: true,
  },
  // Portfolio — only for students
  {
    title: "Portfolio",
    value: "apps",
    icon: <BookOpenTextIcon/>,
    items: [
      { title: "All Projects", url: "#" },
      { title: "Recent", url: "#" },
      { title: "Highlights", url: "#" },
    ],
    roles: ["Student"],           // <-- show only for Student
  },
  // Leaderboard — only for companies (same position in the array)
  {
    title: "Leaderboard",
    value: "leaderboard",
    icon: <Grid />,
    roles: ["Company"],           // <-- show only for Company
  },
  {
    title: "Applied",
    value: "files",
    icon: <FileText />,
    items: [
      { title: "Applications", url: "#" },
      { title: "Interviews", url: "#" },
      { title: "Offers", url: "#" },
    ],
  },
  {
    title: "Assignments",
    value: "projects",
    icon: <Layers />,
    items: [
      { title: "Active Projects", url: "#" },
      { title: "Archived", url: "#" },
    ],
  },
  {
    title: "My Experience",
    value: "learn",
    icon: <Briefcase />,
    items: [
      { title: "Work Experience", url: "#" },
      { title: "Volunteering", url: "#" },
      { title: "Achievements", url: "#" },
    ],
  },
]







// import {
//   BookOpen,
//   Bookmark,
//   Brush,
//   Camera,
//   Code,
//   FileText,
//   Grid,
//   Home,
//   ImageIcon,
//   Layers,
//   LayoutGrid,
//   Palette,
//   Sparkles,
//   Type,
//   Users,
//   Video,
//   CuboidIcon,
// } from "lucide-react"
//
// // Sample data for apps
// export const apps = [
//   {
//     name: "PixelMaster",
//     icon: <ImageIcon className="text-violet-500" />,
//     description: "Advanced image editing and composition",
//     category: "Creative",
//     recent: true,
//     new: false,
//     progress: 100,
//   },
//   {
//     name: "VectorPro",
//     icon: <Brush className="text-orange-500" />,
//     description: "Professional vector graphics creation",
//     category: "Creative",
//     recent: true,
//     new: false,
//     progress: 100,
//   },
//   {
//     name: "VideoStudio",
//     icon: <Video className="text-pink-500" />,
//     description: "Cinematic video editing and production",
//     category: "Video",
//     recent: true,
//     new: false,
//     progress: 100,
//   },
//   {
//     name: "MotionFX",
//     icon: <Sparkles className="text-blue-500" />,
//     description: "Stunning visual effects and animations",
//     category: "Video",
//     recent: false,
//     new: false,
//     progress: 100,
//   },
//   {
//     name: "PageCraft",
//     icon: <Layers className="text-red-500" />,
//     description: "Professional page design and layout",
//     category: "Creative",
//     recent: false,
//     new: false,
//     progress: 100,
//   },
//   {
//     name: "UXFlow",
//     icon: <LayoutGrid className="text-fuchsia-500" />,
//     description: "Intuitive user experience design",
//     category: "Design",
//     recent: false,
//     new: true,
//     progress: 85,
//   },
//   {
//     name: "PhotoLab",
//     icon: <Camera className="text-teal-500" />,
//     description: "Advanced photo editing and organization",
//     category: "Photography",
//     recent: false,
//     new: false,
//     progress: 100,
//   },
//   {
//     name: "DocMaster",
//     icon: <FileText className="text-red-600" />,
//     description: "Document editing and management",
//     category: "Document",
//     recent: false,
//     new: false,
//     progress: 100,
//   },
//   {
//     name: "WebCanvas",
//     icon: <Code className="text-emerald-500" />,
//     description: "Web design and development",
//     category: "Web",
//     recent: false,
//     new: true,
//     progress: 70,
//   },
//   {
//     name: "3DStudio",
//     icon: <CuboidIcon className="text-indigo-500" />,
//     description: "3D modeling and rendering",
//     category: "3D",
//     recent: false,
//     new: true,
//     progress: 60,
//   },
//   {
//     name: "FontForge",
//     icon: <Type className="text-amber-500" />,
//     description: "Typography and font creation",
//     category: "Typography",
//     recent: false,
//     new: false,
//     progress: 100,
//   },
//   {
//     name: "ColorPalette",
//     icon: <Palette className="text-purple-500" />,
//     description: "Color scheme creation and management",
//     category: "Design",
//     recent: false,
//     new: false,
//     progress: 100,
//   },
// ]
//
// // Sample data for recent files
// export const recentFiles = [
//   {
//     name: "Brand Redesign.pxm",
//     app: "PixelMaster",
//     modified: "2 hours ago",
//     icon: <ImageIcon className="text-violet-500" />,
//     shared: true,
//     size: "24.5 MB",
//     collaborators: 3,
//   },
//   {
//     name: "Company Logo.vec",
//     app: "VectorPro",
//     modified: "Yesterday",
//     icon: <Brush className="text-orange-500" />,
//     shared: true,
//     size: "8.2 MB",
//     collaborators: 2,
//   },
//   {
//     name: "Product Launch Video.vid",
//     app: "VideoStudio",
//     modified: "3 days ago",
//     icon: <Video className="text-pink-500" />,
//     shared: false,
//     size: "1.2 GB",
//     collaborators: 0,
//   },
//   {
//     name: "UI Animation.mfx",
//     app: "MotionFX",
//     modified: "Last week",
//     icon: <Sparkles className="text-blue-500" />,
//     shared: true,
//     size: "345 MB",
//     collaborators: 4,
//   },
//   {
//     name: "Magazine Layout.pgc",
//     app: "PageCraft",
//     modified: "2 weeks ago",
//     icon: <Layers className="text-red-500" />,
//     shared: false,
//     size: "42.8 MB",
//     collaborators: 0,
//   },
//   {
//     name: "Mobile App Design.uxf",
//     app: "UXFlow",
//     modified: "3 weeks ago",
//     icon: <LayoutGrid className="text-fuchsia-500" />,
//     shared: true,
//     size: "18.3 MB",
//     collaborators: 5,
//   },
//   {
//     name: "Product Photography.phl",
//     app: "PhotoLab",
//     modified: "Last month",
//     icon: <Camera className="text-teal-500" />,
//     shared: false,
//     size: "156 MB",
//     collaborators: 0,
//   },
// ]
//
// // Sample data for projects
// export const projects = [
//   {
//     name: "Website Redesign",
//     description: "Complete overhaul of company website",
//     progress: 75,
//     dueDate: "June 15, 2025",
//     members: 4,
//     files: 23,
//   },
//   {
//     name: "Mobile App Launch",
//     description: "Design and assets for new mobile application",
//     progress: 60,
//     dueDate: "July 30, 2025",
//     members: 6,
//     files: 42,
//   },
//   {
//     name: "Brand Identity",
//     description: "New brand guidelines and assets",
//     progress: 90,
//     dueDate: "May 25, 2025",
//     members: 3,
//     files: 18,
//   },
//   {
//     name: "Marketing Campaign",
//     description: "Summer promotion materials",
//     progress: 40,
//     dueDate: "August 10, 2025",
//     members: 5,
//     files: 31,
//   },
// ]
//
// // Sample data for tutorials
// export const tutorials = [
//   {
//     title: "Mastering Digital Illustration",
//     description: "Learn advanced techniques for creating stunning digital art",
//     duration: "1h 45m",
//     level: "Advanced",
//     instructor: "Sarah Chen",
//     category: "Illustration",
//     views: "24K",
//   },
//   {
//     title: "UI/UX Design Fundamentals",
//     description: "Essential principles for creating intuitive user interfaces",
//     duration: "2h 20m",
//     level: "Intermediate",
//     instructor: "Michael Rodriguez",
//     category: "Design",
//     views: "56K",
//   },
//   {
//     title: "Video Editing Masterclass",
//     description: "Professional techniques for cinematic video editing",
//     duration: "3h 10m",
//     level: "Advanced",
//     instructor: "James Wilson",
//     category: "Video",
//     views: "32K",
//   },
//   {
//     title: "Typography Essentials",
//     description: "Create beautiful and effective typography for any project",
//     duration: "1h 30m",
//     level: "Beginner",
//     instructor: "Emma Thompson",
//     category: "Typography",
//     views: "18K",
//   },
//   {
//     title: "Color Theory for Designers",
//     description: "Understanding color relationships and psychology",
//     duration: "2h 05m",
//     level: "Intermediate",
//     instructor: "David Kim",
//     category: "Design",
//     views: "41K",
//   },
// ]
//
// // Sample data for community posts
// export const communityPosts = [
//   {
//     title: "Minimalist Logo Design",
//     author: "Alex Morgan",
//     likes: 342,
//     comments: 28,
//     image: "/placeholder.svg?height=300&width=400",
//     time: "2 days ago",
//   },
//   {
//     title: "3D Character Concept",
//     author: "Priya Sharma",
//     likes: 518,
//     comments: 47,
//     image: "/placeholder.svg?height=300&width=400",
//     time: "1 week ago",
//   },
//   {
//     title: "UI Dashboard Redesign",
//     author: "Thomas Wright",
//     likes: 276,
//     comments: 32,
//     image: "/placeholder.svg?height=300&width=400",
//     time: "3 days ago",
//   },
//   {
//     title: "Product Photography Setup",
//     author: "Olivia Chen",
//     likes: 189,
//     comments: 15,
//     image: "/placeholder.svg?height=300&width=400",
//     time: "5 days ago",
//   },
// ]
//
// // Sample data for sidebar navigation
// export const sidebarItems = [
//   {
//     title: "Home",
//     icon: <Home />,
//     isActive: true,
//   },
//   {
//     title: "Apps",
//     icon: <Grid />,
//     badge: "2",
//     items: [
//       { title: "All Apps", url: "#" },
//       { title: "Recent", url: "#" },
//       { title: "Updates", url: "#", badge: "2" },
//       { title: "Installed", url: "#" },
//     ],
//   },
//   {
//     title: "Files",
//     icon: <FileText />,
//     items: [
//       { title: "Recent", url: "#" },
//       { title: "Shared with me", url: "#", badge: "3" },
//       { title: "Favorites", url: "#" },
//       { title: "Trash", url: "#" },
//     ],
//   },
//   {
//     title: "Projects",
//     icon: <Layers />,
//     badge: "4",
//     items: [
//       { title: "Active Projects", url: "#", badge: "4" },
//       { title: "Archived", url: "#" },
//       { title: "Templates", url: "#" },
//     ],
//   },
//   {
//     title: "Learn",
//     icon: <BookOpen />,
//     items: [
//       { title: "Tutorials", url: "#" },
//       { title: "Courses", url: "#" },
//       { title: "Webinars", url: "#" },
//       { title: "Resources", url: "#" },
//     ],
//   },
//   {
//     title: "Community",
//     icon: <Users />,
//     items: [
//       { title: "Explore", url: "#" },
//       { title: "Following", url: "#" },
//       { title: "Challenges", url: "#" },
//       { title: "Events", url: "#" },
//     ],
//   },
//   {
//     title: "Resources",
//     icon: <Bookmark />,
//     items: [
//       { title: "Stock Photos", url: "#" },
//       { title: "Fonts", url: "#" },
//       { title: "Icons", url: "#" },
//       { title: "Templates", url: "#" },
//     ],
//   },
// ]
