import { useEffect } from 'react'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useCreateAuthorMutation, useGetAuthorQuery } from '@/lib/graphql/generated/types-and-hooks'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  image: z.string().min(2, {
    message: "Image must be at least 2 characters.",
  }),
})

const Onboarding = () => {
  const { userId } = useAuth();
  const user = useUser();
  const navigate = useNavigate();  

  console.log(userId)
  const [createAuthor, { loading, error }] = useCreateAuthorMutation();
  const { data: authorData, loading: authorQueryLoading } = useGetAuthorQuery({
    variables: { authorId: userId! } ,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.user?.fullName || "",
      image: user.user?.imageUrl || "",
    },
  })
  useEffect(() => {
    if (user.user?.fullName) {
      form.setValue("name", user.user?.fullName)
    }
    if (user.user?.imageUrl) {
      form.setValue("image", user.user?.imageUrl)
    }
    if(user.user?.fullName && user.user?.imageUrl) {
      form.setFocus("name")
    }
  }, [user.user?.imageUrl, user.user?.fullName, form])

  const { isValid } = form.formState
  if (authorData?.author) {
    navigate('/dashboard')
  }
  if (!userId || user && !user.isSignedIn) {
    console.log('no user', user, userId)
    navigate('/')
    return <></>
  }
  if (loading || authorQueryLoading) return <p>Loading...</p>;
  if (error) return <p>Error : {error?.message}</p>;

  console.log(form.getValues())
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    const res = await createAuthor({ variables: { 
      author: {
        image: values.image,
        name: values.name,
        userId: userId!,
        verified: false,
      }
    }})

    navigate('/dashboard')
    console.log(res)
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={!isValid}>Submit</Button>
      </form>
    </Form>
  )
}

export default Onboarding