import type { ScreenName } from '../context/NavigationContext'
import SetupPage from '../pages/SetupPage'
import HomePage from '../pages/HomePage'
import CourseSelectPage from '../pages/CourseSelectPage'
import QuizPage from '../pages/QuizPage'
import ResultPage from '../pages/ResultPage'
import HandwritingPage from '../pages/HandwritingPage'
import KanjiListPage from '../pages/KanjiListPage'
import KanjiDetailPage from '../pages/KanjiDetailPage'
import ProgressPage from '../pages/ProgressPage'
import CalendarPage from '../pages/CalendarPage'
import AchievementsPage from '../pages/AchievementsPage'
import ParentPage from '../pages/ParentPage'
import DataManagementPage from '../pages/DataManagementPage'

export const SCREEN_COMPONENTS: Record<ScreenName, React.ComponentType> = {
  setup: SetupPage,
  home: HomePage,
  courseSelect: CourseSelectPage,
  quiz: QuizPage,
  result: ResultPage,
  handwriting: HandwritingPage,
  kanjiList: KanjiListPage,
  kanjiDetail: KanjiDetailPage,
  progress: ProgressPage,
  calendar: CalendarPage,
  achievements: AchievementsPage,
  parent: ParentPage,
  dataManagement: DataManagementPage,
}
