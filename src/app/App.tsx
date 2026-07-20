import { AppDataProvider, useAppData } from '../context/AppDataContext'
import { NavigationProvider, useNavigation } from '../context/NavigationContext'
import { QuizSessionProvider } from '../context/QuizSessionContext'
import { PwaStatusProvider } from '../context/PwaStatusContext'
import { ParentGateProvider } from '../context/ParentGateContext'
import { useSystemReducedMotion } from '../hooks/useReducedMotion'
import { SCREEN_COMPONENTS } from './routes'
import OfflineBanner from '../components/pwa/OfflineBanner'
import UpdateBanner from '../components/pwa/UpdateBanner'

function Shell(): React.JSX.Element {
  const { state } = useAppData()
  const { current } = useNavigation()
  const systemReducedMotion = useSystemReducedMotion()
  const reduceMotion = state.settings.reduceMotion || systemReducedMotion

  const screenName = state.settings.hasCompletedSetup ? current.screen : 'setup'
  const PageComponent = SCREEN_COMPONENTS[screenName]

  return (
    <div className={reduceMotion ? 'app-shell reduce-motion' : 'app-shell'}>
      <OfflineBanner />
      <UpdateBanner />
      <PageComponent />
    </div>
  )
}

export function App(): React.JSX.Element {
  return (
    <AppDataProvider>
      <PwaStatusProvider>
        <NavigationProvider initialScreen="home">
          <ParentGateProvider>
            <QuizSessionProvider>
              <Shell />
            </QuizSessionProvider>
          </ParentGateProvider>
        </NavigationProvider>
      </PwaStatusProvider>
    </AppDataProvider>
  )
}

export default App
