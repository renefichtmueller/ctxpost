import { prisma } from "@/lib/prisma";
import { publishToFacebook, validateFacebookToken, postFirstComment } from "./facebook";
import { publishToLinkedIn, postLinkedInComment } from "./linkedin";
import { publishToTwitter, refreshTwitterToken } from "./twitter";
import { publishToInstagram, validateInstagramToken } from "./instagram";
import { publishToThreads, validateThreadsToken } from "./threads";

export async function publishPost(postId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      targets: {
        include: { socialAccount: true },
      },
    },
  });

  if (!post) throw new Error(`Post ${postId} not found`);

  console.log(`[Publisher] Starting publish for post ${postId} with ${post.targets.length} target(s)`);

  // Set post to PUBLISHING
  await prisma.post.update({
    where: { id: postId },
    data: { status: "PUBLISHING" },
  });

  const results = await Promise.allSettled(
    post.targets.map(async (target) => {
      const account = target.socialAccount;
      console.log(`[Publisher] Processing target ${target.id}: ${account.platform} (${account.accountName})`);

      try {
        // Check if account is still active
        if (!account.isActive) {
          throw new Error(
            `Account "${account.accountName}" is deactivated. Please reconnect it.`
          );
        }

        // Check token expiration if available
        if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
          throw new Error(
            `Access token for "${account.accountName}" has expired. Please reconnect the account.`
          );
        }

        let platformPostId: string;

        // Build absolute image URL if relative path
        const postImageUrl = post.imageUrl
          ? post.imageUrl.startsWith("http")
            ? post.imageUrl
            : `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || ""}${post.imageUrl}`
          : undefined;

        if (account.platform === "FACEBOOK") {
          if (account.accountType === "profile") {
            throw new Error(
              `[Facebook/${account.accountName}] Cannot post to personal profiles via API. ` +
              "Please connect a Facebook Page instead."
            );
          }

          // Validate token before attempting to publish
          console.log(`[Publisher] Validating Facebook token for "${account.accountName}"...`);
          const tokenValid = await validateFacebookToken(account.accessToken);
          if (!tokenValid) {
            throw new Error(
              `[Facebook/${account.accountName}] Token is invalid or expired. Please reconnect the account.`
            );
          }

          const result = await publishToFacebook(
            account.platformUserId,
            account.accessToken,
            post.content,
            postImageUrl
          );
          platformPostId = result.id;

          // Post first comment if available
          const firstComment = (post as Record<string, unknown>).firstComment as string | undefined;
          if (firstComment && firstComment.trim()) {
            try {
              await postFirstComment(
                account.platformUserId,
                platformPostId,
                account.accessToken,
                firstComment
              );
              console.log(`[Publisher] First comment posted on Facebook post ${platformPostId}`);
            } catch (commentError) {
              console.error(`[Publisher] Failed to post first comment on Facebook:`, commentError);
              // Don't fail the overall publish if the first comment fails
            }
          }
        } else if (account.platform === "LINKEDIN") {
          const isOrganization = account.accountType === "page" || account.accountType === "organization";
          const result = await publishToLinkedIn(
            account.platformUserId,
            account.accessToken,
            post.content,
            postImageUrl,
            isOrganization
          );
          platformPostId = result.id;

          // Post first comment if available
          const firstComment = (post as Record<string, unknown>).firstComment as string | undefined;
          if (firstComment && firstComment.trim() && platformPostId) {
            try {
              const authorUrn = isOrganization
                ? `urn:li:organization:${account.platformUserId}`
                : `urn:li:person:${account.platformUserId}`;
              await postLinkedInComment(
                platformPostId,
                account.accessToken,
                authorUrn,
                firstComment
              );
              console.log(`[Publisher] First comment posted on LinkedIn post ${platformPostId}`);
            } catch (commentError) {
              console.error(`[Publisher] Failed to post first comment on LinkedIn:`, commentError);
              // Don't fail the overall publish if the first comment fails
            }
          }
        } else if (account.platform === "TWITTER") {
          // Refresh token if expired or about to expire
          let twitterAccessToken = account.accessToken;
          if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000)) {
            if (!account.refreshToken) {
              throw new Error(
                `[Twitter/${account.accountName}] Token expired and no refresh token available. Please reconnect the account.`
              );
            }
            console.log(`[Publisher] Refreshing Twitter token for "${account.accountName}"...`);
            const refreshed = await refreshTwitterToken(account.refreshToken);
            twitterAccessToken = refreshed.accessToken;

            // Update stored tokens
            await prisma.socialAccount.update({
              where: { id: account.id },
              data: {
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
                tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
              },
            });
          }

          const result = await publishToTwitter(
            twitterAccessToken,
            post.content,
            postImageUrl
          );
          platformPostId = result.id;
        } else if (account.platform === "INSTAGRAM") {
          // Instagram REQUIRES an image for every post
          if (!postImageUrl) {
            throw new Error(
              `[Instagram/${account.accountName}] Instagram requires an image for every post. Please add an image to your post.`
            );
          }

          // Validate token before attempting to publish
          console.log(`[Publisher] Validating Instagram token for "${account.accountName}"...`);
          const tokenValid = await validateInstagramToken(account.accessToken);
          if (!tokenValid) {
            throw new Error(
              `[Instagram/${account.accountName}] Token is invalid or expired. Please reconnect the account.`
            );
          }

          const result = await publishToInstagram(
            account.platformUserId,
            account.accessToken,
            post.content,
            postImageUrl
          );
          platformPostId = result.id;
        } else if (account.platform === "THREADS") {
          // Validate token before attempting to publish
          console.log(`[Publisher] Validating Threads token for "${account.accountName}"...`);
          const tokenValid = await validateThreadsToken(account.accessToken);
          if (!tokenValid) {
            throw new Error(
              `[Threads/${account.accountName}] Token is invalid or expired. Please reconnect the account.`
            );
          }

          const result = await publishToThreads(
            account.platformUserId,
            account.accessToken,
            post.content,
            postImageUrl
          );
          platformPostId = result.id;
        } else {
          throw new Error(`[${account.platform}/${account.accountName}] Platform is not yet supported for publishing.`);
        }

        await prisma.postTarget.update({
          where: { id: target.id },
          data: {
            status: "PUBLISHED",
            platformPostId,
            publishedAt: new Date(),
          },
        });

        console.log(`[Publisher] Target ${target.id} (${account.platform}/${account.accountName}) published successfully: ${platformPostId}`);
        return { targetId: target.id, success: true };
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";

        console.error(`[Publisher] Target ${target.id} (${account.platform}/${account.accountName}) failed:`, errorMsg);

        await prisma.postTarget.update({
          where: { id: target.id },
          data: {
            status: "FAILED",
            errorMsg,
          },
        });

        return { targetId: target.id, success: false, error: errorMsg };
      }
    })
  );

  // Determine overall post status
  const allResults = results.map((r) =>
    r.status === "fulfilled" ? r.value : { success: false }
  );
  const anySuccess = allResults.some((r) => r.success);
  const allFailed = allResults.every((r) => !r.success);

  const failedErrors = allResults
    .filter((r) => !r.success && "error" in r)
    .map((r) => (r as { error: string }).error)
    .join("; ");

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: allFailed ? "FAILED" : "PUBLISHED",
      publishedAt: anySuccess ? new Date() : null,
      errorMsg: allFailed ? failedErrors || "All platforms failed" : null,
    },
  });

  console.log(`[Publisher] Post ${postId} finished: ${allFailed ? "FAILED" : "PUBLISHED"}`);
}
