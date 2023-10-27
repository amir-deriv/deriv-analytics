import { Growthbook } from './growthbook'
import { RudderStack } from './rudderstack'
import { TCoreAttributes, TEvents } from './types'

type Options = {
    growthbookKey?: string
    growthbookDecryptionKey?: string
    rudderstackKey: string
    enableDevMode: boolean
}

export function createAnalyticsInstance(options?: Options) {
    let _growthbook: Growthbook, _rudderstack: RudderStack

    const initialise = ({ growthbookKey, growthbookDecryptionKey, rudderstackKey, enableDevMode }: Options) => {
        _rudderstack = RudderStack.getRudderStackInstance(rudderstackKey)

        if (growthbookKey && growthbookDecryptionKey) {
            _growthbook = Growthbook.getGrowthBookInstance(growthbookKey, growthbookDecryptionKey, enableDevMode)
        }
    }

    if (options) {
        initialise(options)
    }
    let coreData = {}
    const setAttributes = ({
        country,
        user_language,
        device_language,
        device_type,
        account_type,
        user_id,
        app_id,
    }: TCoreAttributes) => {
        const user_identity = user_id ? user_id : getId()

        !user_identity && _rudderstack.identifyEvent(user_identity, { language: user_language || 'en' })

        // Check if we have Growthbook instance
        if (_growthbook) {
            _growthbook.setAttributes({
                id: user_identity || getId(),
                country,
                user_language,
                device_language,
                device_type,
            })
        }

        coreData = {
            ...(user_language !== undefined && { user_language }),
            ...(account_type !== undefined && { account_type }),
            ...(app_id !== undefined && { app_id }),
            ...(device_type !== undefined && { device_type }),
        }
    }

    const getFeatureState = (id: string) => _growthbook.getFeatureState(id)?.experimentResult?.name
    const getFeatureValue = (id: string, defaultValue: string) => _growthbook.getFeatureValue(id, defaultValue)
    const setUrl = (href: string) => _growthbook.setUrl(href)
    const getId = () => _rudderstack.getUserId() || _rudderstack.getAnonymousId()

    /**
     * Pushes page view event to Rudderstack
     *
     * @param curret_page The name or URL of the current page to track the page view event
     */
    const pageView = (current_page: string, platform = 'Deriv App') => {
        _rudderstack.pageView(current_page, platform)
    }

    const reset = () => {
        _rudderstack.reset()
    }

    const trackEvent = <T extends keyof TEvents>(event: T, analyticsData: TEvents[T]) => {
        _rudderstack.track(event, { ...coreData, ...analyticsData })
    }
    const getInstances = () => ({ ab: _growthbook, tracking: _rudderstack })

    return {
        initialise,
        setAttributes,
        getFeatureState,
        getFeatureValue,
        setUrl,
        getId,
        trackEvent,
        getInstances,
        pageView,
        reset,
    }
}

export const Analytics = createAnalyticsInstance()
