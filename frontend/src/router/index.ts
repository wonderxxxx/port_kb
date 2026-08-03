import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import DomainWorkbench from '../../index.vue'
import KBQA from '../../components/KBQA.vue'
import KBKnowledge from '../../components/KBKnowledge.vue'
import Login from '../views/Login.vue'
import { useAuth } from '@/composables/auth'

const WHITE_LIST = ['/login']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        public: true,
        title: '登录'
      }
    },
    {
      path: '/',
      redirect: '/domain/zgt'
    },
    {
      path: '/domain/:domain',
      name: 'DomainWorkbench',
      component: DomainWorkbench,
      meta: {
        domainCode: '',
        requiresAuth: true
      }
    },
    {
      path: '/domain/:domain/qa',
      name: 'KBQA',
      component: KBQA,
      meta: {
        domainCode: '',
        requiresAuth: true
      }
    },
    {
      path: '/domain/:domain/knowledge',
      name: 'KBKnowledge',
      component: KBKnowledge,
      meta: {
        domainCode: '',
        requiresAuth: true
      }
    }
  ]
})

function getEffectiveToken(to: RouteLocationNormalized): string | null {
  const { syncTokenFromURL, getToken } = useAuth()
  if (to.query && typeof to.query.token === 'string') {
    syncTokenFromURL(to.query)
  }
  return getToken()
}

router.beforeEach((to, _from, next) => {
  const token = getEffectiveToken(to)
  const { isAuthenticated } = useAuth()

  const isInWhiteList = WHITE_LIST.includes(to.path)
  const isPublic = to.meta?.public === true

  if (isPublic || isInWhiteList) {
    if (token && isAuthenticated.value && to.path === '/login') {
      return next({ path: '/domain/zgt', replace: true })
    }
    return next()
  }

  if (!token || !isAuthenticated.value) {
    const redirect = to.fullPath
    return next({
      path: '/login',
      query: redirect ? { redirect } : undefined,
      replace: true
    })
  }

  return next()
})

export default router
