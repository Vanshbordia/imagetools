import { createFileRoute } from '@tanstack/react-router'
import { ImageConverter } from '../components/ImageConverter'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ImageConverter />
}
