(function (global) {
    'use strict';

    const groups = [
        {
            id: 'core',
            title: 'Core',
            accentColor: '#C0392B',
            controls: [
                {
                    key: 'hideShorts',
                    title: 'Hide Shorts',
                    description: 'Remove all Shorts from feed'
                },
                {
                    key: 'hideHomeFeed',
                    title: 'Hide Homepage Feed',
                    description: 'Hide the Home feed grid'
                },
                {
                    key: 'hideComments',
                    title: 'Hide All Comments',
                    description: 'Remove comment sections entirely'
                },
                {
                    key: 'filterComments',
                    title: 'Filter Comments',
                    description: 'Hide only comments with keywords'
                }
            ]
        },
        {
            id: 'feed',
            title: 'Feeds',
            accentColor: '#2F7A63',
            controls: [
                {
                    key: 'hideSponsoredCards',
                    title: 'Hide Sponsored cards',
                    description: ''
                },
                {
                    key: 'hidePlaylistCards',
                    title: 'Hide Playlist cards',
                    description: 'Remove playlist cards across YouTube'
                },
                {
                    key: 'hideMembersOnly',
                    title: 'Hide Members-only videos',
                    description: 'Hide videos marked with the Members-only badge across feeds and watch'
                },
                {
                    key: 'hideMixPlaylists',
                    title: 'Hide Mix / Radio playlists',
                    description: 'Hide Mix and radio playlist items'
                },
                {
                    key: 'showQuickBlockButton',
                    title: 'Show Quick Block button',
                    description: 'Show a hover button on cards for one-tap blocking of all channels on that card'
                }
            ]
        },
        {
            id: 'watch',
            title: 'Watch page',
            accentColor: '#7C3AED',
            controls: [
                {
                    key: 'hideVideoSidebar',
                    title: 'Hide Video Sidebar',
                    description: 'Hide the right sidebar on watch pages'
                },
                {
                    key: 'hideRecommended',
                    title: 'Hide Recommended (Related Videos)',
                    description: 'Hide Related / Recommended videos'
                },
                {
                    key: 'hideLiveChat',
                    title: 'Hide Live Chat',
                    description: 'Hide live chat panel on live streams'
                },
                {
                    key: 'hideWatchPlaylistPanel',
                    title: 'Hide Watch Playlist panel',
                    description: 'Hide the playlist panel on watch pages'
                }
            ]
        },
        {
            id: 'video_info',
            title: 'Video info',
            accentColor: '#0EA5E9',
            controls: [
                {
                    key: 'hideVideoInfo',
                    title: 'Hide Video Info',
                    description: 'Hide video info sections \n(buttons, channel, description)'
                },
                {
                    key: 'hideVideoButtonsBar',
                    title: 'Hide Video Buttons Bar',
                    description: 'Hide like/share/etc button row'
                },
                {
                    key: 'hideAskButton',
                    title: 'Hide Ask button',
                    description: 'Hide the "Ask" button'
                },
                {
                    key: 'hideVideoChannelRow',
                    title: 'Hide Channel row',
                    description: 'Hide channel info + subscribe section'
                },
                {
                    key: 'hideVideoDescription',
                    title: 'Hide Video Description',
                    description: 'Hide the video description section'
                },
                {
                    key: 'hideMerchTicketsOffers',
                    title: 'Hide Merch, Tickets, Offers',
                    description: 'Hide promotional modules under the video'
                }
            ]
        },
        {
            id: 'player',
            title: 'Player',
            accentColor: '#F97316',
            controls: [
                {
                    key: 'hideEndscreenVideowall',
                    title: 'Hide End Screen Videowall',
                    description: 'Hide endscreen videowall / suggested video grid'
                },
                {
                    key: 'hideEndscreenCards',
                    title: 'Hide End Screen Cards',
                    description: 'Hide endscreen cards (end-card overlays)'
                },
                {
                    key: 'disableAutoplay',
                    title: 'Disable Autoplay',
                    description: 'Disable or suppress autoplay UI'
                },
                {
                    key: 'disableAnnotations',
                    title: 'Disable Annotations',
                    description: 'Hide legacy annotation overlays'
                }
            ]
        },
        {
            id: 'navigation',
            title: 'Navigation',
            accentColor: '#64748B',
            controls: [
                {
                    key: 'hideTopHeader',
                    title: 'Hide Top Header',
                    description: 'Hide the top masthead/header'
                },
                {
                    key: 'hideNotificationBell',
                    title: 'Hide Notification Bell',
                    description: 'Hide the notifications button'
                },
                {
                    key: 'hideExploreTrending',
                    title: 'Hide Explore and Trending',
                    description: 'Hide Explore/Trending entries and pages'
                },
                {
                    key: 'hideMoreFromYouTube',
                    title: 'Hide More from YouTube',
                    description: 'Hide the “More from YouTube” guide section'
                },
                {
                    key: 'hideSubscriptions',
                    title: 'Hide Subscriptions',
                    description: 'Hide subscriptions page and nav entry'
                }
            ]
        },
        {
            id: 'search',
            title: 'Search',
            accentColor: '#10B981',
            controls: [
                {
                    key: 'hideSearchShelves',
                    title: 'Hide Irrelevant Search Results',
                    description: 'Hide non-video shelves like “People also search for”'
                }
            ]
        }
    ];

    function getCatalog() {
        return groups.map(group => ({
            ...group,
            controls: Array.isArray(group.controls) ? [...group.controls] : []
        }));
    }

    function getAllControls() {
        return groups.flatMap(group => group.controls || []).map(control => ({ ...control }));
    }

    function getControlByKey(key) {
        if (!key) return null;
        return getAllControls().find(control => control.key === key) || null;
    }

    global.FilterTubeContentControlsCatalog = {
        getCatalog,
        getAllControls,
        getControlByKey
    };
})(typeof window !== 'undefined' ? window : this);
